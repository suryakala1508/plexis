import { QuotationData, QuotationItem, ContractData } from '../../types/pdfTypes'
import { uploadPdfToDigitalOcean } from './upload';
import axios from 'axios';
import sharp from 'sharp';
import { execFile } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as pathModule from 'path';
const FormData = require('form-data');
function execFileAsync(file: string, args: string[], options: { timeout?: number }): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        execFile(file, args, options, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve({ stdout: String(stdout), stderr: String(stderr) });
        });
    });
}

// Server-side image cache: avoids re-fetching + re-converting images across repeated PDF generations
const _imgCache = new Map<string, { uri: string; exp: number }>();
const IMG_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const IMG_CACHE_MAX = 400;

function imgCacheGet(key: string): string | null {
    const entry = _imgCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.exp) { _imgCache.delete(key); return null; }
    return entry.uri;
}

function imgCacheSet(key: string, uri: string): void {
    if (_imgCache.size >= IMG_CACHE_MAX) _imgCache.delete(_imgCache.keys().next().value!);
    _imgCache.set(key, { uri, exp: Date.now() + IMG_CACHE_TTL_MS });
}

function imageSettingsForCount(count: number): { maxPx: number; quality: number } {
    if (count <= 6)  return { maxPx: 2400, quality: 92 };
    if (count <= 18) return { maxPx: 1800, quality: 90 };
    return               { maxPx: 1400, quality: 88 };
}

async function fetchImageAsDataUri(url: string, maxPx: number, quality: number): Promise<string> {
    const cacheKey = `${url}|${maxPx}|${quality}`;
    const cached = imgCacheGet(cacheKey);
    if (cached) return cached;
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000, maxContentLength: 100 * 1024 * 1024 });
        const buf = await sharp(Buffer.from(res.data))
            .resize({ width: maxPx, height: maxPx, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
        const dataUri = `data:image/jpeg;base64,${buf.toString('base64')}`;
        imgCacheSet(cacheKey, dataUri);
        return dataUri;
    } catch (err: any) {
        console.warn(`[PDF][img] fetch failed ${url}: ${err.message} — using original`);
        return url;
    }
}

async function buildImageCache(urls: string[], maxPx: number, quality: number): Promise<Map<string, string>> {
    const unique = Array.from(new Set(urls.filter(u => u && /^https?:\/\//i.test(u))));
    const results: [string, string][] = new Array(unique.length);
    let idx = 0;
    async function worker() {
        while (idx < unique.length) {
            const i = idx++;
            results[i] = [unique[i], await fetchImageAsDataUri(unique[i], maxPx, quality)];
        }
    }
    await Promise.all(Array.from({ length: Math.min(16, unique.length) }, worker));
    return new Map(results);
}

async function compressWithGhostscript(buffer: Buffer, dpi: number): Promise<Buffer> {
    const tmpDir = os.tmpdir();
    const id = Math.random().toString(36).slice(2);
    const inputPath = pathModule.join(tmpDir, `pdf_in_${id}.pdf`);
    const outputPath = pathModule.join(tmpDir, `pdf_out_${id}.pdf`);
    try {
        await fs.promises.writeFile(inputPath, buffer);
        await execFileAsync('gs', [
            '-dBATCH', '-dNOPAUSE', '-dQUIET',
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            `-dColorImageResolution=${dpi}`,
            `-dGrayImageResolution=${dpi}`,
            `-dMonoImageResolution=${Math.min(dpi * 2, 600)}`,
            '-dColorImageDownsampleThreshold=1.5',
            '-dJPEGQ=92',
            `-sOutputFile=${outputPath}`,
            inputPath
        ], { timeout: 60000 });
        const compressed = await fs.promises.readFile(outputPath);
        console.log(`[PDF] GS @${dpi}dpi: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${(compressed.length / 1024 / 1024).toFixed(1)}MB`);
        return compressed;
    } catch (err: any) {
        console.warn(`[PDF] GS compression failed: ${err.message} — using original`);
        return buffer;
    } finally {
        await Promise.all([
            fs.promises.unlink(inputPath).catch(() => {}),
            fs.promises.unlink(outputPath).catch(() => {})
        ]);
    }
}

export async function compressPdfIfNeeded(buffer: Buffer, thresholdMB = 20): Promise<Buffer> {
    const sizeMB = buffer.length / 1024 / 1024;
    if (sizeMB <= thresholdMB) return buffer;
    console.log(`[PDF] ${sizeMB.toFixed(1)}MB > ${thresholdMB}MB — running GS @150dpi`);
    return compressWithGhostscript(buffer, 150);
}

const sanitizeAbsoluteHttpUrl = (value: unknown): string => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) return '';

    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;

    try {
        const parsed = new URL(withProtocol);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? withProtocol : '';
    } catch {
        return '';
    }
};

const normalizeSocialLinkForPdf = (field: string, value: unknown): string => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) return '';

    const absolute = sanitizeAbsoluteHttpUrl(normalized);
    if (absolute) return absolute;

    const handleMatch = normalized.match(/^@([A-Za-z0-9._-]+)$/);
    if (!handleMatch) return '';

    const handle = handleMatch[1];
    if (field === 'instagram') return `https://www.instagram.com/${handle}/`;
    if (field === 'facebook') return `https://www.facebook.com/${handle}`;
    if (field === 'youtube') return `https://www.youtube.com/${handle}`;
    return '';
};

export async function convertHtmlToPdf(html: string, options: any = {}): Promise<Buffer> {
    console.time('[PDF] Total Conversion via Gotenberg');
    try {
        const form = new FormData();
        form.append('files', Buffer.from(html, 'utf-8'), {
            filename: 'index.html',
            contentType: 'text/html'
        });

        // Add additional options required by Gotenberg if needed
        form.append('paperWidth', '8.27'); // A4 width in inches
        form.append('paperHeight', '11.69'); // A4 height in inches
        form.append('marginTop', '0.0');
        form.append('marginBottom', '0.0');
        form.append('marginLeft', '0.0');
        form.append('marginRight', '0.0');
        form.append('printBackground', 'true');
        form.append('skipNetworkIdleEvent', 'true');
        const waitDelayMs = Number.isFinite(options.waitDelayMs) ? Math.max(0, Number(options.waitDelayMs)) : 1000;
        const waitDelayValue = waitDelayMs >= 1000
            ? `${Math.max(1, Math.round(waitDelayMs / 1000))}s`
            : `${Math.round(waitDelayMs)}ms`;
        form.append('waitDelay', waitDelayValue);

        const url = process.env.GOTENBERG_URL || "";
        const apiKey = process.env.GOTENBERG_API_KEY || "" ;

        if (!url) {
            throw new Error('GOTENBERG_URL is not configured');
        }
        console.time('[PDF] Gotenberg POST');
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders(),
                "X-API-KEY": apiKey
            },
            responseType: 'arraybuffer',
            timeout: options.timeoutMs ?? 90000
        });
        console.timeEnd('[PDF] Gotenberg POST');

        console.log('[PDF] Conversion successful via Gotenberg');
        console.timeEnd('[PDF] Total Conversion via Gotenberg');
        return Buffer.from(response.data);
    } catch (error: any) {
        const isTimeout = error?.code === 'ECONNABORTED';
        console.error('Error converting HTML to PDF using Gotenberg:', {
            message: error?.message,
            timeout: isTimeout,
            status: error?.response?.status,
            details: error?.response?.data?.toString?.() || null
        });
        throw new Error(`PDF conversion failed: ${error.message}`);
    }
}

export function generateQuotationHTML(data: QuotationData): string {
    const itemsHTML = data.items.map(item => `
        <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px;">
                ${item.description}
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #333; font-size: 14px;">
                ${item.rateCard.toFixed(2)}
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #333; font-size: 14px;">
                ${item.qty}
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #333; font-size: 14px;">
                ${item.tax.toFixed(2)}%
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #333; font-size: 14px;">
                ${item.disc.toFixed(2)}%
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #333; font-size: 14px;">
                ${item.amount.toFixed(2)}
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote ${data.quoteNo}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                color: #333;
                line-height: 1.6;
                background: #fff;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 30px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                page-break-inside: avoid;
            }
            
            .logo {
                flex: 1;
            }
            
            .logo img {
                max-width: 150px;
                height: auto;
            }
            
            .logo-text {
                font-size: 48px;
                font-weight: 700;
                color: #1E90FF;
                letter-spacing: -2px;
            }
            
            .quote-info {
                text-align: right;
                flex: 1;
            }
            
            .quote-title {
                font-size: 36px;
                font-weight: 700;
                color: #333;
                margin-bottom: 15px;
            }
            
            .quote-details {
                font-size: 14px;
                color: #666;
                line-height: 1.8;
            }
            
            .quote-details div {
                margin-bottom: 4px;
            }
            
            .label {
                display: inline-block;
                width: 100px;
                color: #999;
            }
            
            .value {
                color: #333;
                font-weight: 500;
            }
            
            .parties {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                page-break-inside: avoid;
            }
            
            .party {
                flex: 1;
            }
            
            .party-title {
                font-size: 14px;
                color: #999;
                margin-bottom: 8px;
                font-weight: 400;
            }
            
            .party-name {
                font-size: 18px;
                font-weight: 700;
                color: #333;
                margin-bottom: 8px;
            }
            
            .party-details {
                font-size: 13px;
                color: #666;
                line-height: 1.8;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            
            .items-table thead {
                background: #1E90FF;
            }
            
            .items-table thead th {
                padding: 12px 8px;
                text-align: left;
                color: #fff;
                font-weight: 600;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .items-table thead th:nth-child(2),
            .items-table thead th:nth-child(3),
            .items-table thead th:nth-child(4),
            .items-table thead th:nth-child(5) {
                text-align: center;
            }
            
            .items-table thead th:last-child {
                text-align: right;
            }
            
            .items-table tbody tr:last-child td {
                border-bottom: none;
            }
            
            .footer-section {
                display: flex;
                justify-content: space-between;
                gap: 40px;
                page-break-inside: avoid;
            }
            
            .payment-instructions {
                flex: 1;
            }
            
            .section-title {
                font-size: 16px;
                font-weight: 700;
                color: #333;
                margin-bottom: 12px;
            }
            
            .payment-details {
                font-size: 13px;
                color: #666;
                line-height: 2;
            }
            
            .totals {
                flex: 1;
                max-width: 350px;
            }
            
            .totals-table {
                width: 100%;
                font-size: 14px;
            }
            
            .totals-table tr {
                border-bottom: 1px solid #f0f0f0;
            }
            
            .totals-table td {
                padding: 10px 0;
            }
            
            .totals-table td:first-child {
                color: #666;
                text-align: left;
            }
            
            .totals-table td:last-child {
                text-align: right;
                color: #333;
                font-weight: 500;
            }
            
            .totals-table .total-row {
                border-top: 2px solid #333;
                border-bottom: 2px solid #333;
            }
            
            .totals-table .total-row td {
                padding: 12px 0;
                font-weight: 700;
                font-size: 16px;
                color: #333;
            }
            
            .totals-table .balance-row {
                border-bottom: none;
            }
            
            .totals-table .balance-row td {
                padding: 12px 0;
                font-weight: 700;
                font-size: 20px;
                color: #333;
            }
            
            .notes {
                margin-top: 30px;
                page-break-inside: avoid;
            }
            
            .notes-content {
                font-size: 13px;
                color: #666;
                line-height: 1.8;
                margin-top: 8px;
            }
            
            .signature {
                margin-top: 60px;
                text-align: right;
                page-break-inside: avoid;
            }
            
            .signature img {
                max-width: 150px;
                height: auto;
            }
            
            @media print {
                body {
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                }
                
                .container {
                    padding: 20px;
                }
            }
            
            @page {
                size: A4;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo">
                    ${data.logo ? `<img src="${data.logo}" alt="Company Logo">` : `<div class="logo-text">SA</div>`}
                </div>
                <div class="quote-info">
                    <div class="quote-title">Quote</div>
                    <div class="quote-details">
                        <div><span class="label">Quote no:</span> <span class="value">${data.quoteNo}</span></div>
                        <div><span class="label">Quote date:</span> <span class="value">${data.quoteDate}</span></div>
                        <div><span class="label">Due:</span> <span class="value">${data.dueDate}</span></div>
                    </div>
                </div>
            </div>
            
            <!-- From and To Section -->
            <div class="parties">
                <div class="party">
                    <div class="party-title">From</div>
                    <div class="party-name">${data.fromCompany}</div>
                    <div class="party-details">
                        ${data.fromName ? `<div>${data.fromName}</div>` : ''}
                        ${data.fromEmail ? `<div>${data.fromEmail}</div>` : ''}
                        ${data.fromPhone ? `<div>${data.fromPhone}</div>` : ''}
                        ${data.fromWebsite ? `<div>${data.fromWebsite}</div>` : ''}
                        ${data.fromAddress ? `<div>${data.fromAddress}</div>` : ''}
                    </div>
                </div>
                <div class="party" style="text-align: right;">
                    <div class="party-title">Bill to</div>
                    <div class="party-name">${data.toCompany}</div>
                    <div class="party-details">
                        ${data.toEmail ? `<div>${data.toEmail}</div>` : ''}
                        ${data.toPhone ? `<div>${data.toPhone}</div>` : ''}
                        ${data.toAddress ? `<div>${data.toAddress}</div>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th>DESCRIPTION</th>
                        <th>RATE_CARD</th>
                        <th>QTY</th>
                        <th>TAX</th>
                        <th>DISC</th>
                        <th>AMOUNT_CARD</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <!-- Footer Section -->
            <div class="footer-section">
                <div class="payment-instructions">
                    <div class="section-title">Payment instruction</div>
                    <div class="payment-details">
                        ${data.paymentInstructions.paypal ? `
                        <div><strong>Paypal email</strong></div>
                        <div>${data.paymentInstructions.paypal}</div>
                        <br>
                        ` : ''}
                        ${data.paymentInstructions.checkPayableTo ? `
                        <div><strong>Make checks payable to</strong></div>
                        <div>${data.paymentInstructions.checkPayableTo}</div>
                        <br>
                        ` : ''}
                        ${data.paymentInstructions.bankTransfer ? `
                        <div><strong>Bank Transfer</strong></div>
                        ${data.paymentInstructions.bankTransfer.routingABA ? `<div>Routing (ABA): ${data.paymentInstructions.bankTransfer.routingABA}</div>` : ''}
                        ${data.paymentInstructions.bankTransfer.accountNumber ? `<div>Account: ${data.paymentInstructions.bankTransfer.accountNumber}</div>` : ''}
                        ` : ''}
                    </div>
                </div>
                
                <div class="totals">
                    <table class="totals-table">
                        <tr>
                            <td>Subtotal:</td>
                            <td>USD ${data.subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Discount${data.discountPercent ? ` (${data.discountPercent}%)` : ''}:</td>
                            <td>USD ${data.discount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Shipping Cost:</td>
                            <td>USD ${data.shippingCost.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Sales Tax:</td>
                            <td>USD ${data.salesTax.toFixed(2)}</td>
                        </tr>
                        <tr class="total-row">
                            <td>Total:</td>
                            <td>USD ${data.total.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Amount paid:</td>
                            <td>USD ${data.amountPaid.toFixed(2)}</td>
                        </tr>
                        <tr class="balance-row">
                            <td>Balance Due:</td>
                            <td>USD ${data.balanceDue.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <!-- Notes -->
            ${data.notes ? `
            <div class="notes">
                <div class="section-title">Notes</div>
                <div class="notes-content">${data.notes}</div>
            </div>
            ` : ''}
            
            <!-- Signature -->
            <div class="signature">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Signature" style="display: none;">
            </div>
        </div>
    </body>
    </html>
    `;
}

export async function generateQuotationPDF(data: QuotationData): Promise<string> {
    console.time('[PDF] generateQuotationPDF Total');
    
    console.time('[PDF] HTML Generation');
    const html = generateQuotationHTML(data);
    console.timeEnd('[PDF] HTML Generation');
    
    console.time('[PDF] HTML -> PDF Convert');
    const buffer = await convertHtmlToPdf(html);
    console.timeEnd('[PDF] HTML -> PDF Convert');
    
    console.time('[PDF] Upload to Digital Ocean');
    const url = await uploadPdfToDigitalOcean(buffer, data.toCompany || data.fromCompany, 'quotation');
    console.timeEnd('[PDF] Upload to Digital Ocean');
    
    console.timeEnd('[PDF] generateQuotationPDF Total');
    return url;
}

export async function generateQuotationHTMLFromPreview(data: any): Promise<string> {
    console.time('[PDF] generateQuotationHTMLFromPreview Total');
    const { paymentMilestones = [], quotationNumber, quotationDate, dueDate, taxRate, discount, notes, termsAndConditions, paymentMethods, serviceColumns = {}, fields = {}, complimentary = [], deliverables = [], template = {}, eventName = '' } = data;

    // Fallback logic for nested objects
    const hasValues = (obj: any) => obj && Object.keys(obj).length > 0;
    // Merge template defaults with runtime customization so user edits always take precedence.
    const customization = {
        ...(template?.customization || {}),
        ...(data.customization || {})
    };
    const backgroundData = (hasValues(data.background) && data.background.type) ? data.background : (template?.background || customization.background || data.background || {});
    const quotationBackgroundData = (hasValues(data.quotationBackground) && data.quotationBackground.type) ? data.quotationBackground : (template?.quotationBackground || {});
    const background = quotationBackgroundData.type ? quotationBackgroundData : backgroundData;
    const studio = hasValues(data.studio) ? data.studio : {};
    const clientRaw = (data.client && typeof data.client === 'object' && data.client.name) ? data.client : (data.leadId || {});
    const client = {
        name: clientRaw.name,
        email: clientRaw.email,
        phone: clientRaw.phone || clientRaw.contactNumber || clientRaw.whatsappNumber,
        address: clientRaw.address || clientRaw.Location
    };
    const event = data.event || {};
    const items = data.items || [];

    const hexToRgba = (hex: string, opacity: number) => {
        if (!hex) return `rgba(255, 255, 255, ${opacity})`;
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 255;
        const g = parseInt(hex.substring(2, 4), 16) || 255;
        const b = parseInt(hex.substring(4, 6), 16) || 255;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const headerBg = customization.headerColor || '#1F2937';
    const tableColor = customization.tableColumnColor || '#ffffff';
    const tableOpacity = customization.tableColumnOpacity !== undefined ? customization.tableColumnOpacity : 1;
    const cellBg = hexToRgba(tableColor, tableOpacity);
    const accent = customization.primaryColor || customization.accentColor || '#9916b1';
    const font = customization.fontFamily || 'Inter';
    const sectionHorizontalPadding = '32px';
    const rawPortfolioImages = Array.isArray(customization.portfolioImages) ? customization.portfolioImages : [];
    const sanitizedPortfolioImages: string[] = Array.from(new Set(
        rawPortfolioImages
            .map((img: unknown) => sanitizeAbsoluteHttpUrl(img))
            .filter((img: string) => img.length > 0)
    ));

    // Pre-fetch all images as base64 data URIs so Chromium has nothing to fetch externally.
    const addImgUrl = (url: unknown, out: string[]) => { if (typeof url === 'string' && /^https?:\/\//i.test(url)) out.push(url); };
    const imageUrlsToPrefetch: string[] = [];
    addImgUrl(studio?.logo, imageUrlsToPrefetch);
    addImgUrl((backgroundData as any)?.imageUrl, imageUrlsToPrefetch);
    addImgUrl((quotationBackgroundData as any)?.imageUrl, imageUrlsToPrefetch);
    addImgUrl((customization.introPageBackground as any)?.imageUrl, imageUrlsToPrefetch);
    for (const bg of Object.values(customization.portfolioPageBackgrounds || {}) as any[]) addImgUrl(bg?.imageUrl, imageUrlsToPrefetch);
    sanitizedPortfolioImages.forEach(u => addImgUrl(u, imageUrlsToPrefetch));
    const { maxPx, quality } = imageSettingsForCount(sanitizedPortfolioImages.length);
    console.time('[PDF] Image pre-fetch');
    const imageCache = await buildImageCache(imageUrlsToPrefetch, maxPx, quality);
    console.timeEnd('[PDF] Image pre-fetch');

    // field visibility helper
    const show = (key: string) => {
        if (key === 'portfolio') {
            return (!fields || fields[key] !== false) && sanitizedPortfolioImages.length > 0;
        }
        return !fields || fields[key] !== false;
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const fmtDate = (d: any) => {
        if (!d) return '';
        if (typeof d === 'string' && d.includes(' - ')) return d;
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return String(d);
        try { return dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch { return String(d); }
    };
    const fmtCur = (n: number) => {
        if (isNaN(n)) return '₹0';
        return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    // ── Services rows ─────────────────────────────────────────────────────────
    const showAmount = serviceColumns.individualAmounts !== false;
    const showCrew = serviceColumns.crew !== false;
    const showEquip = serviceColumns.equipment !== false;
    const showDate = serviceColumns.date !== false;
    const showLocation = serviceColumns.location !== false;

    // ── Totals ────────────────────────────────────────────────────────────────
    const subtotal = items.reduce((sum: number, item: any) => {
        return sum + (Number(item.amount) || Number(item.total) || 0);
    }, 0);
    const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
    const discountAmt = discount?.enabled
        ? discount.type === 'percentage'
            ? (subtotal * (Number(discount.value) || 0)) / 100
            : (Number(discount.value) || 0)
        : 0;
    const grandTotal = subtotal + taxAmount - discountAmt;

    // ── Deliverables ──────────────────────────────────────────────────────────
    const deliverablesSection = (show('deliverablesTable') && deliverables.length > 0) ? `
        <div style="padding:6px 20px 4px 20px;">
            <p style="font-size:11px; font-weight:700; color:${accent}; text-transform:uppercase; margin:0 0 4px 0; letter-spacing:0.05em;">Deliverables</p>
            <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:4px; overflow:hidden; font-size:12px;">
                <thead>
                    <tr style="background-color:${headerBg};">
                        <th style="padding:8px 12px; text-align:left; color:#fff; font-weight:600; width:40px;">#</th>
                        <th style="padding:8px 12px; text-align:left; color:#fff; font-weight:600;">Item</th>
                    </tr>
                </thead>
                <tbody style="background-color:${cellBg};">
                    ${deliverables.map((d: any, i: number) => {
        const qty = Number(d.quantity) || 1;
        const name = typeof d === 'string' ? d : (d.name || d.description || '-');
        const displayName = qty > 1 ? `${name} x ${qty}` : name;
        return `
                    <tr style="border-bottom:1px solid #f3f4f6;">
                        <td style="padding:6px 12px; color:#9ca3af;">${i + 1}</td>
                        <td style="padding:6px 12px; color:#374151;">${displayName}</td>
                    </tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>` : '';

    // ── Complimentary ─────────────────────────────────────────────────────────
    const complimentarySection = (show('complimentaryTable') && complimentary.length > 0) ? `
        <div style="padding:4px 20px;">
            <p style="font-size:11px; font-weight:700; color:${accent}; text-transform:uppercase; margin:0 0 4px 0; letter-spacing:0.05em;">Complimentary</p>
            <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:4px; overflow:hidden; font-size:12px;">
                <thead>
                    <tr style="background-color:${headerBg};">
                        <th style="padding:8px 12px; text-align:left; color:#fff; font-weight:600; width:40px;">#</th>
                        <th style="padding:8px 12px; text-align:left; color:#fff; font-weight:600;">Item</th>
                    </tr>
                </thead>
                <tbody style="background-color:${cellBg};">
                    ${complimentary.map((c: any, i: number) => {
        const qty = Number(c.quantity) || 1;
        const name = typeof c === 'string' ? c : (c.name || c.description || '-');
        const displayName = qty > 1 ? `${name} x ${qty}` : name;
        return `
                    <tr style="border-bottom:1px solid #f3f4f6;">
                        <td style="padding:6px 12px; color:#9ca3af;">${i + 1}</td>
                        <td style="padding:6px 12px; color:#374151;">${displayName}</td>
                    </tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>` : '';

    // ── Payment Timeline ──────────────────────────────────────────────────────
    const paymentTimelineSection = (show('paymentTimeline') && paymentMilestones.length > 0) ? `
        <div style="padding:4px 20px;">
            <p style="font-size:11px; font-weight:700; color:${accent}; text-transform:uppercase; margin:0 0 4px 0; letter-spacing:0.05em;">Payment Timeline</p>
            <div style="display:flex; flex-direction:column; gap:4px;">
                ${paymentMilestones.map((m: any, i: number) => {
        const mAmt = Number(m.amount) || 0;
        return `<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background-color:rgba(255,255,255,0.6); border:1px solid #e5e7eb; border-radius:4px; font-size:12px;">
                        <span style="color:#374151; font-weight:500;">${m.description || `Milestone ${i + 1}`}</span>
                        <span style="color:#9ca3af;">${m.dueDate ? `Due ${fmtDate(m.dueDate)}` : ''}</span>
                        <span style="font-weight:600; color:${accent};">₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(mAmt)}</span>
                    </div>`;
    }).join('')}
            </div>
        </div>` : '';

    // ── PORTFOLIO PAGES ───────────────────────────────────────────────────────
    let portfolioHTML = '';
    if (show('portfolio')) {
        const portImages = sanitizedPortfolioImages;

        console.log('[PDF][portfolio] image counts', {
            requested: Array.isArray(customization.portfolioImages) ? customization.portfolioImages.length : 0,
            valid: portImages.length
        });
        const socialLinks = {
            website: normalizeSocialLinkForPdf('website', customization.website),
            youtube: normalizeSocialLinkForPdf('youtube', customization.youtube),
            facebook: normalizeSocialLinkForPdf('facebook', customization.facebook),
            instagram: normalizeSocialLinkForPdf('instagram', customization.instagram),
        };
            
        let pages = [];
        
        // Use tplBackground for pages if template background exists, otherwise fallback
        const coverBgData = template?.background || data.background || {};
        const coverBgType = coverBgData.type || 'solid';
        const coverBgColor = coverBgData.color || '#ffffff';
        const coverBg = coverBgType === 'image' && coverBgData.imageUrl
            ? `background-image: url('${imageCache.get(coverBgData.imageUrl) || coverBgData.imageUrl}'); background-size: ${coverBgData.imageSize === 'repeat' ? 'auto' : '100% 100%'}; background-position: center; background-repeat: ${coverBgData.imageSize === 'repeat' ? 'repeat' : 'no-repeat'};`
            : coverBgType === 'gradient'
                ? `background-image: linear-gradient(${coverBgData.gradientDirection || 'to bottom right'}, ${coverBgData.gradientFrom || '#ffffff'}, ${coverBgData.gradientTo || '#f3e8ff'});`
                : `background-color: ${coverBgColor};`;
        
        const overlayStyle = coverBgType === 'image'
            ? `<div style="position: absolute; inset: 0; background-color: rgba(255,255,255,${coverBgData.imageOpacity !== undefined ? coverBgData.imageOpacity : 0.15}); z-index: 0;"></div>`
            : '';

        const rawPortfolioPageBackgrounds: any = customization.portfolioPageBackgrounds instanceof Map
            ? Object.fromEntries(customization.portfolioPageBackgrounds.entries())
            : (customization.portfolioPageBackgrounds || {});

        const introPageBackground: any = customization.introPageBackground || null;

        const getIntroPageBackgroundStyles = () => {
            if (introPageBackground?.type === 'image' && introPageBackground?.imageUrl) {
                return {
                    backgroundStyle: `background-image: url('${imageCache.get(introPageBackground.imageUrl) || introPageBackground.imageUrl}'); background-size: ${introPageBackground.imageSize === 'repeat' ? 'auto' : '100% 100%'}; background-position: center; background-repeat: ${introPageBackground.imageSize === 'repeat' ? 'repeat' : 'no-repeat'};`,
                    overlayHtml: `<div style="position: absolute; inset: 0; background-color: rgba(255,255,255,${introPageBackground.imageOpacity !== undefined ? introPageBackground.imageOpacity : 0.15}); z-index: 0;"></div>`,
                };
            }

            if (introPageBackground?.type === 'gradient') {
                return {
                    backgroundStyle: `background-image: linear-gradient(${introPageBackground.gradientDirection || 'to bottom right'}, ${introPageBackground.gradientFrom || '#ffffff'}, ${introPageBackground.gradientTo || '#f3e8ff'});`,
                    overlayHtml: '',
                };
            }

            if (introPageBackground?.type === 'solid' && introPageBackground?.color) {
                return {
                    backgroundStyle: `background-color: ${introPageBackground.color};`,
                    overlayHtml: '',
                };
            }

            return {
                backgroundStyle: coverBg,
                overlayHtml: overlayStyle,
            };
        };

        const getPortfolioPageBackgroundStyles = (pageIndex: number) => {
            const pageKey = `page${pageIndex + 1}`;
            const pageBg = rawPortfolioPageBackgrounds?.[pageKey];

            if (pageBg?.type === 'image' && pageBg?.imageUrl) {
                return {
                    backgroundStyle: `background-image: url('${imageCache.get(pageBg.imageUrl) || pageBg.imageUrl}'); background-size: ${pageBg.imageSize === 'repeat' ? 'auto' : '100% 100%'}; background-position: center; background-repeat: ${pageBg.imageSize === 'repeat' ? 'repeat' : 'no-repeat'};`,
                    overlayHtml: `<div style="position: absolute; inset: 0; background-color: rgba(255,255,255,${pageBg.imageOpacity !== undefined ? pageBg.imageOpacity : 0.15}); z-index: 0;"></div>`,
                };
            }

            if (pageBg?.type === 'gradient') {
                return {
                    backgroundStyle: `background-image: linear-gradient(${pageBg.gradientDirection || 'to bottom right'}, ${pageBg.gradientFrom || '#ffffff'}, ${pageBg.gradientTo || '#f3e8ff'});`,
                    overlayHtml: '',
                };
            }

            if (pageBg?.type === 'solid' && pageBg?.color) {
                return {
                    backgroundStyle: `background-color: ${pageBg.color};`,
                    overlayHtml: '',
                };
            }

            return {
                backgroundStyle: coverBg,
                overlayHtml: overlayStyle,
            };
        };

        // Page 1: Cover Page
        pages.push(`
            <div style="page-break-after: always; page-break-inside: avoid; break-inside: avoid; height: 297mm; width: 210mm; max-height: 297mm; position: relative; ${coverBg} display: flex; flex-direction: column; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden;">
                ${overlayStyle}
                <!-- Social Icons at Top -->
                <div style="position: relative; z-index: 1; padding: 30px 40px; display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;">
                    ${socialLinks.website ? `<a href="${socialLinks.website}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">` : `<span style="display: inline-flex; align-items: center; justify-content: center;">`}
                        <svg style="width: 28px; height: 28px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
                            <circle cx="12" cy="12" r="9" fill="none" stroke="#1f2937" stroke-width="2"/>
                            <path d="M3 12h18" fill="none" stroke="#1f2937" stroke-width="1.8"/>
                            <path d="M12 3c3 2.8 3 15.2 0 18" fill="none" stroke="#1f2937" stroke-width="1.8"/>
                            <path d="M12 3c-3 2.8-3 15.2 0 18" fill="none" stroke="#1f2937" stroke-width="1.8"/>
                        </svg>
                    ${socialLinks.website ? `</a>` : `</span>`}
                    ${socialLinks.youtube ? `<a href="${socialLinks.youtube}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">` : `<span style="display: inline-flex; align-items: center; justify-content: center;">`}
                        <svg style="width: 28px; height: 28px; fill: #ef4444;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    ${socialLinks.youtube ? `</a>` : `</span>`}
                    ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">` : `<span style="display: inline-flex; align-items: center; justify-content: center;">`}
                        <svg style="width: 28px; height: 28px; fill: #1877f2;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    ${socialLinks.facebook ? `</a>` : `</span>`}
                    ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">` : `<span style="display: inline-flex; align-items: center; justify-content: center;">`}
                        <svg style="width: 28px; height: 28px;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
                            <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="#e4405f" stroke-width="2"/>
                            <circle cx="12" cy="12" r="4" fill="none" stroke="#e4405f" stroke-width="2"/>
                            <circle cx="17.5" cy="6.5" r="1.2" fill="#e4405f"/>
                        </svg>
                    ${socialLinks.instagram ? `</a>` : `</span>`}
                </div>
                <div style="position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px;">
                    <div style="width: 100px; height: 100px; border-radius: 20px; ${studio?.logo ? '' : 'background-color: rgba(255,255,255,0.4); border: 2px solid rgba(255,255,255,0.6);'} display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                         ${studio?.logo ? `<img src="${imageCache.get(studio.logo) || studio.logo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px;">` : `<span style="font-size: 32px; font-weight: bold; color: #000;">${(studio?.name || 'P').charAt(0).toUpperCase()}</span>`}
                    </div>
                    <h1 style="font-size: 28px; font-weight: bold; color: #000; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">${studio?.name || 'Your Studio'}</h1>
                    <p style="font-size: 14px; font-weight: 500; color: #1f2937; letter-spacing: 1px; margin-bottom: 4px;">${studio?.tagline || 'Photography & Videography'}</p>
                    ${studio?.address ? `<p style="font-size: 14px; font-weight: 500; color: #1f2937; margin-top: 4px;">${studio.address}</p>` : ''}
                </div>
            </div>
        `);

        // Page 2: Intro Page (always centered)
        const textAlignStyle = 'text-align: center; align-items: center;';

        if (customization.coverDescription || (customization.featuredOnItems && customization.featuredOnItems.length > 0)) {
            const { backgroundStyle: introPageBackgroundStyle, overlayHtml: introPageOverlayHtml } = getIntroPageBackgroundStyles();
            pages.push(`
                <div style="page-break-after: always; page-break-inside: avoid; break-inside: avoid; height: 297mm; width: 210mm; max-height: 297mm; position: relative; ${introPageBackgroundStyle} display: flex; flex-direction: column; padding: 70px; box-sizing: border-box; ${textAlignStyle}; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden;">
                    ${introPageOverlayHtml}
                    <div style="position: relative; z-index: 1; max-width: 700px; width: 100%; margin: 0 auto;">
                        <p style="font-size: 28px; font-weight: 600; font-family: Georgia, serif; color: #000; margin-bottom: 24px; text-align: center;">Hello,</p>
                        ${customization.coverDescription ? `<p style="font-size: 16px; color: #000; line-height: 1.8; white-space: pre-wrap; margin-bottom: 40px; text-align: center;">${customization.coverDescription}</p>` : ''}
                        
                        ${customization.featuredOnItems && customization.featuredOnItems.length > 0 ? `
                        <div style="margin-top: 40px; text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center;">
                            <h3 style="font-size: 18px; font-weight: bold; color: #000; font-family: Georgia, serif; margin-bottom: 16px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 4px;">Featured On</h3>
                            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; font-size: 14px;">
                                ${customization.featuredOnItems.map((item: any) => {
                const featuredLabel = (item?.name || 'Link').toUpperCase();
                const featuredHref = sanitizeAbsoluteHttpUrl(item?.url);
                return featuredHref
                    ? `<a href="${featuredHref}" target="_blank" rel="noopener noreferrer" style="font-weight: 600; color: ${accent}; border-bottom: 1px dashed ${accent}; padding-bottom: 2px; text-decoration: none; display: inline-block;">${featuredLabel}</a>`
                    : `<span style="font-weight: 600; color: ${accent}; border-bottom: 1px dashed ${accent}; padding-bottom: 2px;">${featuredLabel}</span>`;
            }).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `);
        }

        const PORTFOLIO_IMAGES_PER_PAGE = 6;
        const PORTFOLIO_GRID_COLUMNS = 2;
        const PORTFOLIO_GRID_ROWS = 3;
        const PORTFOLIO_GRID_INSET = '92%';

        // Portfolio Pages
        if (portImages.length > 0) {
            const chunkSize = PORTFOLIO_IMAGES_PER_PAGE;
            const chunks: string[][] = [];
            for (let i = 0; i < portImages.length; i += chunkSize) {
                chunks.push(portImages.slice(i, i + chunkSize));
            }

            chunks.forEach((chunk: string[], index: number) => {
                const { backgroundStyle, overlayHtml } = getPortfolioPageBackgroundStyles(index);
                const tilesHtml = chunk.map((img: string) => `
                    <div style="overflow: hidden;">
                        <img src="${imageCache.get(img) || img}" loading="eager" decoding="sync" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                    </div>
                `).join('');

                pages.push(`
                    <div style="page-break-after: always; page-break-inside: avoid; break-inside: avoid; height: 297mm; width: 210mm; max-height: 297mm; position: relative; ${backgroundStyle} padding: 0; box-sizing: border-box; display: flex; flex-direction: column; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden;">
                        ${overlayHtml}
                        <div style="position: relative; z-index: 1; width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            <div style="width: ${PORTFOLIO_GRID_INSET}; height: ${PORTFOLIO_GRID_INSET}; display: grid; grid-template-columns: repeat(${PORTFOLIO_GRID_COLUMNS}, 1fr); grid-template-rows: repeat(${PORTFOLIO_GRID_ROWS}, 1fr); gap: 0; align-content: stretch; overflow: hidden;">
                                ${tilesHtml}
                            </div>
                        </div>
                    </div>
                `);
            });
        }
        portfolioHTML = pages.join('');
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation ${quotationNumber || ''}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: ${customization.fontFamily || 'Inter'}, sans-serif;
                background-color: #ffffff;
                color: #374151;
                line-height: 1.5;
            }
            .container {
                position: relative;
                z-index: 1;
                width: 210mm;
                max-width: 100%;
                margin: 0 auto;
                min-height: 297mm;
                padding-bottom: 90px;
                background-color: ${background.type === 'solid' ? (background.color || '#ffffff') : 'transparent'};
                ${background.type === 'gradient' ? `background-image: linear-gradient(${background.gradientDirection || 'to bottom right'}, ${background.gradientFrom || '#ffffff'}, ${background.gradientTo || '#f3e8ff'});` : ''}
                ${background.type === 'image' && background.imageUrl ? `background-image: url('${imageCache.get(background.imageUrl) || background.imageUrl}'); background-size: ${background.imageSize === 'repeat' ? 'auto' : '100% 100%'}; background-position: center; background-repeat: ${background.imageSize === 'repeat' ? 'repeat' : 'no-repeat'};` : ''}
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .container::before {
                ${background.type === 'image' && background.imageUrl ? `
                content: "";
                position: absolute;
                inset: 0;
                background-color: #ffffff;
                opacity: ${background.imageOpacity ?? 0.15};
                z-index: -1;
                ` : 'display: none;'}
            }
            .header {
                padding: 16px 20px;
                background-color: transparent;
                border-bottom: 1px solid #e5e7eb;
            }
            .header-content {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                word-break: break-word;
            }
            .logo-section {
                display: flex;
                align-items: center;
                gap: 16px;
                max-width: 50%;
            }
            .logo {
                max-width: 150px;
                max-height: 80px;
                object-fit: contain;
                border-radius: 4px;
            }
            .studio-info {
                text-align: right;
                max-width: 45%;
            }
            .studio-name {
                font-size: 24px;
                font-weight: 700;
                color: #374151;
                line-height: 1.2;
                margin-bottom: 4px;
            }
            .quotation-number {
                font-size: 14px;
                color: #6b7280;
                margin-top: 4px;
            }
            .parties {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 16px 20px;
                border-bottom: 1px solid #e5e7eb;
                background-color: transparent;
                word-break: break-word;
                page-break-inside: avoid;
            }
            .party {
                display: flex;
                flex-direction: column;
            }
            .party-title {
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 12px;
            }
            .party-name {
                font-weight: 700;
                color: #374151;
                margin-bottom: 4px;
            }
            .party-detail {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 2px;
            }
            .items-section {
                padding: 16px 20px;
                background-color: transparent;
                page-break-inside: avoid;
            }
            .section-title {
                font-size: 18px;
                font-weight: 700;
                color: #374151;
                margin-bottom: 16px;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
            }
            .items-table thead tr {
                background-color: ${headerBg};
            }
            .items-table th {
                text-align: left;
                font-size: 12px;
                font-weight: 600;
                color: #ffffff;
                padding: 12px;
            }
            .items-table th:nth-child(2),
            .items-table th:nth-child(3),
            .items-table th:nth-child(4) {
                text-align: left;
            }
            .items-table th:last-child {
                text-align: right;
            }
            .items-table tbody {
                background-color: ${cellBg};
            }
            .items-table td {
                padding: 12px;
                word-break: break-word;
                white-space: pre-wrap;
            }
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-top: 24px;
                page-break-inside: avoid;
            }
            .totals {
                width: 320px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
                margin-bottom: 8px;
            }
            .total-row span:first-child {
                color: #6b7280;
            }
            .total-row span:last-child {
                font-weight: 500;
                color: #374151;
            }
            .total-row.discount span:last-child {
                color: #10b981;
            }
            .grand-total {
                display: flex;
                justify-content: space-between;
                font-size: 18px;
                font-weight: 700;
                padding-top: 12px;
                border-top: 2px solid #d1d5db;
                color: ${customization.primaryColor || '#D4AF37'};
            }
            .notes-section {
                padding: 16px 20px;
                border-top: 1px solid #e5e7eb;
                background-color: transparent;
                page-break-inside: avoid;
            }
            .notes-title {
                font-size: 14px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .notes-content {
                font-size: 14px;
                color: #374151;
                white-space: pre-wrap;
            }
            .terms-section {
                padding: 16px 20px;
                border-top: 1px solid #e5e7eb;
                background-color: transparent;
                page-break-inside: avoid;
            }
            .terms-title {
                font-size: 14px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .terms-content {
                font-size: 12px;
                color: #6b7280;
                white-space: pre-wrap;
            }
            .footer {
                padding: 16px 20px;
                text-align: center;
                color: #ffffff;
                font-size: 14px;
                background-color: ${customization.headerColor || '#1F2937'};
            }
            .footer span {
                font-weight: 600;
            }
            @media print {
                body {
                    background-color: #ffffff;
                }
                .container {
                    box-shadow: none;
                }
            }
            @page {
                size: A4;
                margin: 0;
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0;">
        <!-- Prepend Portfolio HTML before invoice body -->
        ${portfolioHTML}
        
        <!-- Quotation Section -->
        <div style="background-color: #ffffff; position: relative;">
            <div class="container" style="width: 210mm; max-width: 100%; border: none; box-shadow: none;">
                <!-- ── STUDIO HEADER ────────────────────────────────────────────── -->
                ${show('studioHeader') ? `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; background-color: ${headerBg};">
                    <div style="display: flex; align-items: center; ">
                        ${(studio?.logo && typeof studio.logo === 'string' && studio.logo.length > 5) ? `
                        <img src="${imageCache.get(studio.logo) || studio.logo}" alt="Logo" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; margin-right: 20px; border: 1px solid rgba(255,255,255,0.3);" />
                        ` : `
                        <div style=" margin-right: 20px; width: 48px; height: 48px; border-radius: 8px; background-color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <span style="color: #fff; font-weight: 700; font-size: 18px; line-height: 1;">${(studio?.name || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        `}
                        <div>
                            <p style="color: #ffffff; font-weight: 700; font-size: 14px; letter-spacing: 0.05em; margin: 0 0 2px 0;">${studio?.name || 'Studio Name'}</p>
                            <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 0 0 2px 0;">${studio?.tagline || 'Photography &amp; Videography'}</p>
                            ${(studio?.phone || studio?.email || studio?.address) ? `<p style="color: rgba(255,255,255,0.5); font-size: 10px; margin: 0;">${[studio?.phone, studio?.email, studio?.address].filter(Boolean).join(' · ')}</p>` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <p style="color: rgba(255,255,255,0.6); font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 3px 0;">Quotation</p>
                        ${quotationNumber ? `<p style="color: #ffffff; font-weight: 700; font-size: 14px; margin: 0 0 2px 0;">${quotationNumber}</p>` : ''}
                        ${quotationDate ? `<p style="color: rgba(255,255,255,0.5); font-size: 10px; margin: 0;">${fmtDate(quotationDate)}</p>` : ''}
                    </div>
                </div>
                ` : ''}
                <!-- Welcome Message / Introduction -->
                ${show('welcomeMessage') && (data.welcomeMessage || template?.welcomeMessage) ? `
                <div style="padding: 12px 20px; font-size: 12px; color: #374151; line-height: 1.6;">
                    <p style="font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">Welcome, ${client?.name || 'Client'}!</p>
                    <p style="margin: 0; text-align: left; white-space: pre-wrap;">${(data.welcomeMessage || template?.welcomeMessage || '').trim()}</p>
                </div>` : ''}

                <!-- Client and Quotation Side-by-Side -->
                ${show('clientDetails') ? `
                <div style="display: flex; justify-content: space-between; padding: 12px 20px; gap: 20px;">
                    <!-- Client Details -->
                    <div style="flex: 1; overflow: hidden;">
                        <p style="font-size: 11px; font-weight: 700; color: ${accent}; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;">Client Details</p>
                        <table style="font-size: 12px; width: 100%; border-collapse: collapse;">
                            <tbody>
                                <tr><td style="padding: 3px 0; font-weight: 600; color: #4b5563; width: 90px; white-space: nowrap; vertical-align: top;">Name</td><td style="padding: 3px 0; color: #374151;">: ${client.name || 'Client Name'}</td></tr>
                                <tr><td style="padding: 3px 0; font-weight: 600; color: #4b5563; white-space: nowrap; vertical-align: top;">Contact No</td><td style="padding: 3px 0; color: #374151;">: ${client.phone || ''}</td></tr>
                                <tr><td style="padding: 3px 0; font-weight: 600; color: #4b5563; white-space: nowrap; vertical-align: top;">Email</td><td style="padding: 3px 0; color: #374151;">: ${client.email || ''}</td></tr>
                                <tr><td style="padding: 3px 0; font-weight: 600; color: #4b5563; white-space: nowrap; vertical-align: top;">Address</td><td style="padding: 3px 0; color: #374151;">: ${client.address || ''}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Quotation Info Box -->
                    <div style="width: 240px; background-color: rgba(255,255,255,0.4); border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; align-self: flex-start; flex-shrink: 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; width: 90px; white-space: nowrap;">Quote ID</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${quotationNumber || '–'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; white-space: nowrap;">Quote Date</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${fmtDate(quotationDate) || '–'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; white-space: nowrap;">Valid Till</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${fmtDate(dueDate) || '–'}</td>
                            </tr>
                            ${eventName ? `<tr>
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; white-space: nowrap;">Event</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${eventName}</td>
                            </tr>` : ''}
                        </table>
                    </div>
                </div>
                ` : `
                <div style="display: flex; justify-content: flex-end; padding: 12px 20px; gap: 20px;">
                    <!-- Quotation Info Box (when Client Details are disabled) -->
                    <div style="width: 240px; background-color: rgba(255,255,255,0.4); border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; align-self: flex-start; flex-shrink: 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; width: 90px; white-space: nowrap;">Quote ID</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${quotationNumber || '–'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; white-space: nowrap;">Quote Date</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${fmtDate(quotationDate) || '–'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; white-space: nowrap;">Valid Till</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${fmtDate(dueDate) || '–'}</td>
                            </tr>
                            ${eventName ? `<tr>
                                <td style="padding: 6px 10px; background-color: ${headerBg}; color: #fff; font-weight: 600; white-space: nowrap;">Event</td>
                                <td style="padding: 6px 10px; color: #374151; font-weight: 500;">${eventName}</td>
                            </tr>` : ''}
                        </table>
                    </div>
                </div>
                `}

            <!-- ── EVENT DETAILS ──────────────────────────────────────────── -->
            ${(show('eventDetails') && (event?.type || event?.date || event?.time || event?.location)) ? `
            <div style="padding:12px 20px; page-break-inside: avoid;">
                <p style="font-size: 11px; font-weight: 700; color: ${accent}; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;">Event Details</p>
                <table style="font-size: 12px; width: 100%; border-collapse: collapse;">
                    <tbody>
                        ${event?.type ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #4b5563; width: 80px; white-space: nowrap;">Type</td><td style="padding: 3px 0; color: #374151;">: ${event.type}</td></tr>` : ''}
                        ${(event?.date || event?.time) ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #4b5563; white-space: nowrap;">Date</td><td style="padding: 3px 0; color: #374151;">: ${event?.date?.includes(' - ') ? event.date : `${event?.date ? fmtDate(event.date) : ''} ${event?.time || ''}`.trim()}</td></tr>` : ''}
                        ${event?.location ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #4b5563; white-space: nowrap;">Venue</td><td style="padding: 3px 0; color: #374151;">: ${event.location}</td></tr>` : ''}
                    </tbody>
                </table>
            </div>` : ''}

            <!-- ── SERVICES TABLE ─────────────────────────────────────────── -->
            ${(show('servicesTable') && items.length > 0) ? `
            <div style="padding:12px 20px;">
                <p style="font-size:11px; font-weight:700; color:${accent}; text-transform:uppercase; margin-bottom:6px; letter-spacing:.05em;">Services</p>
                <table style="width:100%; border-collapse:collapse; border:1px solid #d1d5db; font-size:12px;">
                    <thead style="display: table-header-group;">
                        <tr style="background-color:${headerBg}; page-break-after: avoid;">
                            <th style="padding:8px 10px; text-align:center; color:#fff; font-weight:600; width:36px; border-right:1px solid rgba(255,255,255,0.2);">#</th>
                            <th style="padding:8px 10px; text-align:left; color:#fff; font-weight:600; border-right:1px solid rgba(255,255,255,0.2);">Event Details</th>
                            ${showAmount ? `<th style="padding:8px 10px; text-align:right; color:#fff; font-weight:600; width:110px;">Amount</th>` : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item: any, i: number) => {
        const amount = Number(item.amount) || Number(item.total) || 0;
        const name = item.event || item.description || `Item ${i + 1}`;
        const dateS = showDate && item.date ? ((typeof item.date === 'string' && item.date.includes(' - ')) ? item.date : fmtDate(item.date)) : '';
        const loc = showLocation && item.location ? item.location : '';
        
        const lineStyle = 'font-size:10px; color:#6b7280; margin-top:2px; margin-left:10px; padding-left:4px;';
        const lineNoBullet = (text: string) => `<div style="${lineStyle}">${text}</div>`;
        
        const packageLines: string[] = [];
        // Package name only — items flow through crew/equipment arrays below
        if (item.packages && item.packages.length > 0) {
            item.packages.forEach((pkg: any) => {
                packageLines.push(`<div style="font-weight:600; color:#374151; font-size:11px; margin-top:4px;">${pkg.name || 'Package'}</div>`);
            });
        }
        
        // Grouped Crew for PDF
        if (showCrew && Array.isArray(item.crew) && item.crew.length) {
            const crewGroups: Record<string, number> = {};
            item.crew.forEach((c: any) => {
                const cName = c.name || String(c);
                crewGroups[cName] = (crewGroups[cName] || 0) + 1;
            });
            Object.entries(crewGroups).forEach(([cName, qty]) => {
                packageLines.push(lineNoBullet(qty > 1 ? `${cName} x ${qty}` : cName));
            });
        }
        
        // Grouped Equipment for PDF
        if (showEquip && Array.isArray(item.equipment) && item.equipment.length) {
            const equipGroups: Record<string, number> = {};
            item.equipment.forEach((e: any) => {
                const eName = e.name || String(e);
                equipGroups[eName] = (equipGroups[eName] || 0) + 1;
            });
            Object.entries(equipGroups).forEach(([eName, qty]) => {
                packageLines.push(lineNoBullet(qty > 1 ? `${eName} x ${qty}` : eName));
            });
        }

        const detailsHtml = packageLines.length ? `<div style="padding-left:8px; margin-top:4px;">${packageLines.join('')}</div>` : '';
        const rowBg = i % 2 === 0 ? 'background-color:' + cellBg : 'background-color:#f9fafb';
        
        return `
                            <tr style="border-bottom:1px solid #e5e7eb; vertical-align:top; ${rowBg};">
                                <td style="padding:8px 10px; color:#6b7280; text-align:center; border-right:1px solid #e5e7eb; font-weight:500;">${i + 1}</td>
                                <td style="padding:8px 10px; border-right:1px solid #e5e7eb;">
                                    <div style="font-weight:600; color:#1f2937; font-size:12px;">
                                        ${name}
                                        ${dateS || loc ? `<span style="color:#6b7280; font-size:10px; font-weight:400; margin-left:6px;">${[dateS, loc].filter(Boolean).join(' · ')}</span>` : ''}
                                    </div>
                                    ${detailsHtml}
                                </td>
                                ${showAmount ? `<td style="padding:8px 10px; text-align:right; font-weight:600; white-space:nowrap; color:#1f2937;">${fmtCur(amount)}</td>` : ''}
                            </tr>`;
    }).join('')}
                    </tbody>
                </table>

                <!-- Totals -->
                <div style="display: flex; justify-content: flex-end; margin-top: 8px; page-break-inside: avoid;">
                    <div style="width: 250px;">
                        <table style="width:100%; border-collapse:collapse; font-size:12px;">
                            <tbody>
                                <tr style="border-bottom:1px solid #e5e7eb;">
                                    <td style="padding:6px 10px; color:#6b7280; text-align:left;">Sub Total</td>
                                    <td style="padding:6px 10px; text-align:right; font-weight:600; color:#374151; width:110px;">${fmtCur(subtotal)}</td>
                                </tr>
                                ${taxAmount > 0 ? `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 10px; color:#6b7280; text-align:left;">GST (${taxRate}%)</td><td style="padding:6px 10px; text-align:right; font-weight:600; color:#374151; width:110px;">${fmtCur(taxAmount)}</td></tr>` : ''}
                                ${discountAmt > 0 ? `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 10px; color:#059669; text-align:left;">Discount</td><td style="padding:6px 10px; text-align:right; font-weight:600; color:#059669; width:110px;">-${fmtCur(discountAmt)}</td></tr>` : ''}
                                <tr style="border-top:1px solid #d1d5db; margin-top: 4px;">
                                    <td style="padding:8px 10px; color:${accent}; text-align:left; font-weight:700; font-size:13px;">Grand Total</td>
                                    <td style="padding:8px 10px; text-align:right; font-weight:700; color:${accent}; width:110px; font-size:13px;">${fmtCur(grandTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>` : ''}

            ${deliverablesSection}
            ${complimentarySection}
            ${paymentTimelineSection}

            <!-- ── NOTES ──────────────────────────────────────────────────── -->
            ${(show('notes') && notes) ? `
            <div style="padding:12px ${sectionHorizontalPadding}; page-break-inside: avoid;">
                <p style="font-size:11px; font-weight:700; color:${accent}; text-transform:uppercase; margin:0 0 4px 0; letter-spacing:.05em;">Notes</p>
                <p style="font-size:12px; color:#6b7280; font-style:italic; background:rgba(255,255,255,.6); border:1px solid #e5e7eb; border-radius:4px; padding:6px 10px; white-space:pre-wrap; margin:0;">${notes}</p>
            </div>` : ''}

            <!-- ── ACCEPTED PAYMENT METHODS ────────────────────────────────── -->
            ${(data.paymentMethods && Object.values(data.paymentMethods).some(v => v === true)) ? `
            <div style="padding:12px ${sectionHorizontalPadding}; page-break-inside: avoid;">
                <p style="font-size:11px; font-weight:700; color:${accent}; text-transform:uppercase; margin:0 0 4px 0; letter-spacing:.05em;">Accepted Payment Methods</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px;">
                    ${Object.entries(data.paymentMethods)
            .filter(([_, enabled]) => enabled === true)
            .map(([method, _]) => `
                        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; padding: 4px 8px; color: #4b5563; background-color: ${cellBg}; border: 1px solid #e5e7eb; border-radius: 4px;">
                            ${method.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                    `).join('')}
                </div>
            </div>` : ''}

            <!-- ── TERMS & CONDITIONS ─────────────────────────────────────── -->
            ${(show('termsAndConditions') && termsAndConditions) ? `
            <div style="padding:12px ${sectionHorizontalPadding}; page-break-inside: avoid;">
                <p style="font-size:11px; font-weight:700; color:${accent}; text-transform:uppercase; margin:0 0 4px 0; letter-spacing:.05em;">Terms &amp; Conditions</p>
                <p style="font-size:12px; color:#6b7280; background:rgba(255,255,255,.6); border:1px solid #e5e7eb; border-radius:4px; padding:6px 10px; white-space:pre-wrap; margin:0;">${termsAndConditions}</p>
            </div>` : ''}

            <!-- ── FOOTER BAR ─────────────────────────────────────────────── -->
            <div style="position:absolute; bottom:0; left:0; right:0; padding:14px ${sectionHorizontalPadding}; text-align:center; background-color:${headerBg}; line-height:1.25; -webkit-print-color-adjust:exact; print-color-adjust:exact;">
                <p style="color:#fff; font-weight:600; font-size:12px; margin:0; line-height:1.25;">Thank you for choosing ${studio.name || 'us'}</p>
                ${(studio.email || studio.phone || studio.address) ? `<p style="color:rgba(255,255,255,.5); font-size:11px; margin:2px 0 0 0; line-height:1.25;">${[studio.email, studio.phone, studio.address].filter(Boolean).join('')}</p>` : ''}
                <p style="color:rgba(255,255,255,.4); font-size:11px; margin:2px 0 0 0; line-height:1.25;">Powered by Plexis</p>
            </div>
        </div>
    </body>
    </html>
    `;
}


export async function generateQuotationPDFFromPreview(data: any): Promise<string> {
    console.time('[PDF] generateQuotationPDFFromPreview Total');
    
    console.time('[PDF] HTML Generation (Preview)');
    const html = await generateQuotationHTMLFromPreview(data);
    console.timeEnd('[PDF] HTML Generation (Preview)');
    
    console.time('[PDF] HTML -> PDF Convert (Preview)');
    const rawBuffer = await convertHtmlToPdf(html, {
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        waitDelayMs: 0,
        timeoutMs: 120000,
    });
    console.timeEnd('[PDF] HTML -> PDF Convert (Preview)');

    console.time('[PDF] GS Compress (Preview)');
    const buffer = await compressPdfIfNeeded(rawBuffer);
    console.timeEnd('[PDF] GS Compress (Preview)');

    console.time('[PDF] Upload to Digital Ocean (Preview)');
    const url = await uploadPdfToDigitalOcean(buffer, data.client?.name || data.studio?.name || 'quotation', 'quotation');
    console.timeEnd('[PDF] Upload to Digital Ocean (Preview)');
    
    console.timeEnd('[PDF] generateQuotationPDFFromPreview Total');
    return url;
}


export function generateContractHTML(data: ContractData): string {
    const termsHTML = data.terms.map(term => `
        <div class="term-section">
            <h3 class="term-title">${term.title}</h3>
            <p class="term-content">${term.content}</p>
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Georgia', 'Times New Roman', serif;
                color: #333;
                line-height: 1.8;
                background: #fff;
            }
            
            .container {
                max-width: 750px;
                margin: 0 auto;
                padding: 40px 30px;
            }
            
            .header-decoration {
                text-align: center;
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            
            .header-decoration img {
                max-width: 400px;
                height: auto;
                opacity: 0.8;
            }
            
            .contract-title {
                text-align: center;
                font-size: 32px;
                font-weight: 400;
                letter-spacing: 8px;
                text-transform: uppercase;
                color: #2c2c2c;
                margin-bottom: 40px;
                page-break-inside: avoid;
            }
            
            .intro-text {
                font-size: 13px;
                line-height: 1.9;
                color: #4a4a4a;
                margin-bottom: 35px;
                text-align: justify;
                page-break-inside: avoid;
            }
            
            .term-section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            
            .term-title {
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: #2c2c2c;
                margin-bottom: 12px;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 8px;
            }
            
            .term-content {
                font-size: 13px;
                line-height: 1.9;
                color: #4a4a4a;
                text-align: justify;
            }
            
            .signature-text {
                font-size: 13px;
                line-height: 1.9;
                color: #4a4a4a;
                margin: 40px 0 30px 0;
                text-align: center;
                page-break-inside: avoid;
            }
            
            .signature-section {
                display: flex;
                justify-content: space-between;
                margin-top: 50px;
                gap: 30px;
                page-break-inside: avoid;
            }
            
            .signature-block {
                flex: 1;
            }
            
            .signature-label {
                font-size: 13px;
                color: #666;
                margin-bottom: 8px;
                font-weight: 600;
            }
            
            .signature-line {
                border-bottom: 1px solid #333;
                min-height: 60px;
                margin-bottom: 10px;
                position: relative;
            }
            
            .signature-line img {
                max-width: 150px;
                max-height: 50px;
                position: absolute;
                bottom: 5px;
                left: 0;
            }
            
            .signature-name {
                font-size: 12px;
                color: #666;
                margin-bottom: 20px;
            }
            
            .date-section {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 12px;
                color: #666;
            }
            
            .date-label {
                font-weight: 600;
            }
            
            .date-line {
                border-bottom: 1px solid #333;
                flex: 1;
                max-width: 100px;
                padding: 0 10px;
                text-align: center;
            }
            
            .footer {
                text-align: center;
                margin-top: 60px;
                padding-top: 30px;
                border-top: 1px solid #e0e0e0;
                page-break-inside: avoid;
            }
            
            .footer-company {
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: #2c2c2c;
                margin-bottom: 5px;
            }
            
            .footer-website {
                font-size: 12px;
                color: #666;
            }
            
            .highlight {
                font-weight: 600;
                color: #2c2c2c;
            }
            
            @media print {
                body {
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                }
                
                .container {
                    padding: 20px;
                }
            }
            
            @page {
                size: A4;
                margin: 15mm;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header Decoration -->
            ${data.headerImage ? `
            <div class="header-decoration">
                <img src="${data.headerImage}" alt="Header Decoration">
            </div>
            ` : ''}
            
            <!-- Contract Title -->
            <h1 class="contract-title">${data.title}</h1>
            
            <!-- Introduction Text -->
            <div class="intro-text">
                ${data.agreementText}
            </div>
            
            <!-- Terms and Conditions -->
            ${termsHTML}
            
            <!-- Signature Acceptance Text -->
            <div class="signature-text">
                Signature of both parties below indicates the acceptance of this agreement.
            </div>
            
            <!-- Signature Section -->
            <div class="signature-section">
                <div class="signature-block">
                    <div class="signature-label">Client Name:</div>
                    <div class="signature-line">
                        ${data.clientSignature?.signature ? `<img src="${data.clientSignature.signature}" alt="Client Signature">` : ''}
                    </div>
                    <div class="signature-name">${data.clientSignature?.name || data.clientName || '_____________________'}</div>
                    
                    <div class="signature-label">Signature:</div>
                    <div class="signature-line"></div>
                    
                    <div class="date-section">
                        <span class="date-label">Date:</span>
                        <span class="date-line">${data.clientSignature?.date || ''}</span>
                        <span>/</span>
                        <span class="date-line"></span>
                        <span>/</span>
                        <span class="date-line"></span>
                    </div>
                </div>
                
                <div class="signature-block">
                    <div class="signature-label">Photographer Name:</div>
                    <div class="signature-line">
                        ${data.photographerSignature?.signature ? `<img src="${data.photographerSignature.signature}" alt="Photographer Signature">` : ''}
                    </div>
                    <div class="signature-name">${data.photographerSignature?.name || data.photographerName || '_____________________'}</div>
                    
                    <div class="signature-label">Signature:</div>
                    <div class="signature-line"></div>
                    
                    <div class="date-section">
                        <span class="date-label">Date:</span>
                        <span class="date-line">${data.photographerSignature?.date || ''}</span>
                        <span>/</span>
                        <span class="date-line"></span>
                        <span>/</span>
                        <span class="date-line"></span>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-company">${data.footerCompanyName || 'YOUR NAME PHOTOGRAPHY'}</div>
                <div class="footer-website">${data.footerWebsite || 'www.yourcompanywebsite.com'}</div>
            </div>
        </div>
    </body>
    </html>
    `;
}

export async function generateContractPDF(data: ContractData): Promise<string> {
    const html = generateContractHTML(data);
    console.log(html);
    const buffer = await convertHtmlToPdf(html);
    const url = await uploadPdfToDigitalOcean(buffer, data.companyName || 'company', 'contract');
    return url;
}

export function generateContractHTMLFromPreview(contractData: any, quotationData: any = null): string {
    const { agreement, terms, copyright, disclaimer, items, paymentMilestones } = contractData;

    // Use contract items if available, otherwise fall back to quotation items
    const displayItems = items && items.length > 0 ? items : (quotationData?.items || []);
    const displayPaymentMilestones = paymentMilestones && paymentMilestones.length > 0 ? paymentMilestones : (quotationData?.paymentMilestones || []);

    // Calculate totals from items
    let subtotal = 0;
    if (displayItems && displayItems.length > 0) {
        subtotal = displayItems.reduce((sum: number, item: any) => {
            const amount = item.amount === '' || item.amount === null || item.amount === undefined ? 0 : Number(item.amount) || 0;
            const itemTotal = amount || (item.total || ((item.rate || 0) * (item.quantity || 1)));
            return sum + itemTotal;
        }, 0);
    }
    const taxRate = quotationData?.taxRate || 0;
    const tax = (subtotal * taxRate) / 100;
    const discount = quotationData?.discount?.enabled
        ? quotationData.discount.type === 'percentage'
            ? (subtotal * quotationData.discount.value) / 100
            : quotationData.discount.value
        : 0;
    const total = subtotal + tax - discount;

    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '_____________';
        if (typeof dateStr === 'string' && dateStr.includes(' - ')) return dateStr;
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return dateStr;
        try {
            return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatDateShort = (dateStr: string | undefined): string => {
        if (!dateStr) return '';
        if (typeof dateStr === 'string' && dateStr.includes(' - ')) return dateStr;
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return dateStr;
        try {
            return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount: number): string => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Build terms HTML with proper formatting
    let termsHTML = '';
    if (terms.customTerms || quotationData?.termsAndConditions) {
        const termsText = terms.customTerms || quotationData.termsAndConditions || '';
        const lines = termsText.split('\n');
        termsHTML = lines.map((line: string) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
            const isNumbered = /^\d+[\.\)]\s/.test(trimmed);

            if (isBullet || isNumbered) {
                return `<p style="margin-bottom: 8px; margin-left: 16px; color: #000000;">${line}</p>`;
            } else if (trimmed) {
                return `<p style="margin-bottom: 8px; color: #000000;">${line}</p>`;
            } else {
                return '<br />';
            }
        }).join('');
    } else {
        termsHTML = ''; // Hide if empty
    }

    // Build items HTML
    let itemsHTML = '';
    if (displayItems && displayItems.length > 0) {
        const { serviceColumns = {} } = quotationData || {};
        itemsHTML = displayItems.map((item: any, index: number) => {
            const amount = item.amount === '' || item.amount === null || item.amount === undefined ? 0 : Number(item.amount) || 0;
            const itemTotal = amount || (item.total || ((item.rate || 0) * (item.quantity || 1)));
            const eventName = item.event || item.description || `Item ${index + 1}`;

            return `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 4px; margin-bottom: 4px; border-bottom: 1px solid #eee;">
                    <div style="flex: 1; overflow: hidden;">
                        <p style="font-weight: 600; margin-bottom: 2px; color: #000000; font-size: 11px;">${eventName}</p>
                        ${(serviceColumns.date !== false && item.date) ? `<p style="font-size: 10px; color: #666; margin: 0;">Date: ${new Date(item.date).toLocaleDateString()}</p>` : ''}
                        ${(serviceColumns.location !== false && item.location) ? `<p style="font-size: 10px; color: #666; margin: 0;">Loc: ${item.location}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <p style="font-weight: 600; color: #000000; font-size: 11px;">${formatCurrency(itemTotal)}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Add totals
        itemsHTML += `
            <div style="border-top: 1px solid #000000; padding-top: 8px; margin-top: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #000000;">
                    <span>Subtotal:</span>
                    <span style="font-weight: 600;">${formatCurrency(subtotal)}</span>
                </div>
                ${tax > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #000000;">
                    <span>Tax (${taxRate}%):</span>
                    <span style="font-weight: 600;">${formatCurrency(tax)}</span>
                </div>
                ` : ''}
                ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #000000;">
                    <span>Discount:</span>
                    <span style="font-weight: 600;">-${formatCurrency(discount)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-top: 8px; padding-top: 8px; border-top: 1px solid #000000; color: #000000;">
                    <span>Grand Total:</span>
                    <span>${formatCurrency(total)}</span>
                </div>
            </div>
        `;
    }

    // Build payment milestones HTML
    let paymentMilestonesHTML = '';
    if (displayPaymentMilestones && displayPaymentMilestones.length > 0) {
        paymentMilestonesHTML = displayPaymentMilestones.map((milestone: any, index: number) => {
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid #000000; margin-bottom: 4px;">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 2px; color: #000000; font-size: 11px;">${milestone.description || `Payment Milestone ${index + 1}`}</p>
                        ${milestone.dueDate ? `<p style="font-size: 10px; margin-top: 1px; color: #000000;">Due Date: ${formatDateShort(milestone.dueDate)}</p>` : ''}
                    </div>
                    ${milestone.amount > 0 ? `<p style="font-weight: 600; color: #000000; font-size: 11px;">${formatCurrency(milestone.amount)}</p>` : ''}
                </div>
            `;
        }).join('');
    }

    const studioName = quotationData?.studio?.name || agreement.photographerName || 'Studio Name';
    const clientName = quotationData?.client?.name || agreement.corporationName || 'Client Name';
    const studioAddress = quotationData?.studio?.address || agreement.photographerAddress || '';
    const clientAddress = quotationData?.client?.address || agreement.corporationAddress || '';
    const studioPhone = quotationData?.studio?.phone || '';
    const studioGst = quotationData?.studio?.gstNumber || '';
    const clientEmail = quotationData?.client?.email || '';
    const clientPhone = quotationData?.client?.phone || '';
    const studioLogo = quotationData?.studio?.logo || '';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Service Agreement Contract</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: Georgia, "Times New Roman", serif;
                color: #000000;
                background-color: #ffffff;
                line-height: 1.4; /* Tighter line height */
                font-size: 11px; /* Smaller base font */
            }
            .container {
                max-width: 100%;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 0; /* Remove container padding, rely on page margins */
            }
            .header {
                padding-bottom: 16px;
                border-bottom: 1px solid #000000;
                margin-bottom: 16px;
            }
            .header-content {
                width: 100%;
                border-collapse: collapse;
            }
            .header-content td {
                vertical-align: top;
            }
            .logo-img {
                height: 50px; /* Smaller logo */
                width: 50px;
                object-fit: contain;
                flex-shrink: 0;
                filter: grayscale(100%);
            }
            .header-text {
                flex: 1;
            }
            .studio-name {
                font-size: 18px; /* Smaller heading */
                font-weight: 700;
                color: #000000;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            .studio-details {
                font-size: 10px; /* Smaller details */
                color: #000000;
                margin-bottom: 2px;
            }
            .contract-title {
                margin-top: 12px;
            }
            .contract-title h2 {
                font-size: 16px;
                font-weight: 700;
                color: #000000;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            .parties {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
                padding-bottom: 16px;
                border-bottom: 1px solid #000000;
                margin-bottom: 16px;
            }
            .party-title {
                font-size: 10px;
                font-weight: 700;
                color: #666;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .party-name {
                font-weight: 700;
                font-size: 12px;
                color: #000000;
                margin-bottom: 4px;
            }
            .party-detail {
                font-size: 10px;
                color: #000000;
                line-height: 1.4;
                margin-bottom: 2px;
            }
            .content {
                padding: 0;
            }
            .agreement-text {
                font-size: 11px;
                line-height: 1.5;
                color: #000000;
                text-align: justify;
                margin-bottom: 12px;
            }
            .section-title {
                font-size: 13px;
                font-weight: 700;
                color: #000000;
                text-transform: uppercase;
                margin-bottom: 8px;
                border-bottom: 1px solid #eee;
                padding-bottom: 4px;
            }
            .section-content {
                font-size: 11px;
                line-height: 1.5;
                color: #000000;
                text-align: justify;
            }
            .items-section {
                margin-top: 16px;
                margin-bottom: 16px;
            }
            .payment-section {
                margin-top: 16px;
                margin-bottom: 16px;
            }
            .notes-section {
                margin-top: 16px;
                margin-bottom: 16px;
            }
            .copyright-section {
                margin-top: 16px;
                margin-bottom: 16px;
            }
            .disclaimer-section {
                margin-top: 16px;
                margin-bottom: 16px;
            }
            .signature-section {
                margin-top: 32px;
                border-top: 1px solid #000000;
                padding-top: 24px;
                page-break-inside: avoid; /* Prevent breaking signatures across pages */
            }
            .signatures {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 48px;
            }
            .signature-block {
                display: flex;
                flex-direction: column;
            }
            .signature-label {
                font-size: 11px;
                font-weight: 700;
                color: #000000;
                text-transform: uppercase;
                margin-bottom: 32px; /* Space for signature */
            }
            .signature-line {
                border-bottom: 1px solid #000000;
                margin-bottom: 8px;
            }
            .signature-name {
                font-size: 11px;
                font-weight: 700;
                color: #000000;
                margin-bottom: 2px;
            }
            .signature-date {
                font-size: 10px;
                color: #000000;
            }
            @page {
                size: A4;
                margin: 10mm; /* Markedly reduced margins */
            }
            @media print {
                body {
                    background-color: #ffffff;
                }
                .container {
                    padding: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <table class="header-content">
                    <tr>
                        ${studioLogo ? `
                        <td style="width: 80px; padding-right: 24px;">
                            <img src="${studioLogo}" alt="${studioName}" class="logo-img">
                        </td>` : ''}
                        <td>
                        <h1 class="studio-name">${studioName}</h1>
                        ${studioAddress ? `<p class="studio-details">${studioAddress}</p>` : ''}
                        ${studioPhone ? `<p class="studio-details">${studioPhone}</p>` : ''}
                        ${studioGst ? `<p class="studio-details">GSTIN: ${studioGst}</p>` : ''}
                        <div class="contract-title">
                            <h2>AGREEMENT</h2>
                        </div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Parties -->
            <div class="parties">
                <div>
                    <h3 class="party-title">Service Provider</h3>
                    <p class="party-name">${studioName}</p>
                    ${studioAddress ? `<p class="party-detail">${studioAddress}</p>` : ''}
                    ${studioPhone ? `<p class="party-detail">${studioPhone}</p>` : ''}
                    ${studioGst ? `<p class="party-detail">GSTIN: ${studioGst}</p>` : ''}
                </div>
                <div>
                    <h3 class="party-title">Client</h3>
                    <p class="party-name">${clientName}</p>
                    ${clientAddress ? `<p class="party-detail">${clientAddress}</p>` : ''}
                    ${clientEmail ? `<p class="party-detail">${clientEmail}</p>` : ''}
                    ${clientPhone ? `<p class="party-detail">${clientPhone}</p>` : ''}
                </div>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Agreement Text -->
                <div style="margin-bottom: 32px;">
                    <p class="agreement-text">
                        This Agreement is made this <strong>${formatDate(agreement.agreementDate)}</strong> between 
                        <strong>${clientName}</strong>,${clientAddress ? ` located at <strong>${clientAddress}</strong>,` : ''} (the "Client"), and 
                        <strong>${studioName}</strong>,${studioAddress ? ` located at <strong>${studioAddress}</strong>,` : ''} (the "Service Provider").
                    </p>
                    ${(agreement.eventDescription || quotationData?.event?.type) ? `
                    <p class="agreement-text">
                        This Agreement pertains to the following event: <strong>${agreement.eventDescription || quotationData?.event?.type || '_____________'}</strong>
                    </p>
                    ` : ''}
                    ${quotationData?.event?.date ? `
                    <p class="agreement-text">
                        Event Date: <strong>${formatDateShort(quotationData.event.date)}</strong>${quotationData.event.location ? `, Location: <strong>${quotationData.event.location}</strong>` : ''}
                    </p>
                    ` : ''}
                    ${agreement.duration ? `
                    <p class="agreement-text">
                        This Agreement is for the following length of time: <strong>${agreement.duration}</strong>
                    </p>
                    ` : ''}
                    ${agreement.deliveryDays ? `
                    <p class="agreement-text">
                        Photographs shall be delivered within <strong>${agreement.deliveryDays}</strong> days of event completion.
                    </p>
                    ` : ''}
                    <p class="agreement-text">
                        The Client and the Service Provider hereby agree to the following terms:
                    </p>
                </div>

                <!-- Terms and Conditions -->
                <!-- Terms and Conditions -->
                ${termsHTML ? `
                <div style="margin-bottom: 24px;">
                    <h3 class="section-title">Terms and Conditions</h3>
                    <div class="section-content">
                        ${termsHTML}
                    </div>
                </div>
                ` : ''}

                <!-- Items -->
                ${itemsHTML ? `
                <div class="items-section">
                    <h3 class="section-title">Services and Items</h3>
                    ${itemsHTML}
                </div>
                ` : ''}

                <!-- Payment Milestones -->
                ${paymentMilestonesHTML ? `
                <div class="payment-section">
                    <h3 class="section-title">Payment Schedule</h3>
                    ${paymentMilestonesHTML}
                </div>
                ` : ''}

                <!-- Notes -->
                ${quotationData?.notes ? `
                <div class="notes-section">
                    <h3 class="section-title">Additional Notes</h3>
                    <div class="section-content" style="white-space: pre-wrap;">${quotationData.notes}</div>
                </div>
                ` : ''}

                <!-- Copyright -->
                ${copyright.transferCopyright ? `
                <div class="copyright-section">
                    <h3 class="section-title">Copyright and Licensing</h3>
                    <p class="agreement-text">
                        The Service Provider agrees to transfer the copyrights of images as described below to the Client.
                    </p>
                    <div style="margin-left: 24px; margin-top: 16px;">
                        <p class="agreement-text">
                            1. The image(s) subject to this agreement are as follows: <strong>${copyright.imagesDescription || '_____________'}</strong>
                        </p>
                    </div>
                </div>
                ` : (copyright.photoCredit || copyright.licensingTerms) ? `
                <div class="copyright-section">
                    <h3 class="section-title">Copyright and Licensing</h3>
                    <p class="agreement-text">
                        The Service Provider and the Client agree to the following licensing terms:
                    </p>
                    <ul style="list-style-type: disc; margin-left: 24px; margin-top: 16px; color: #000000;">
                        <li style="margin-bottom: 12px; line-height: 1.8;">
                            The Service Provider retains all rights to each image. The Service Provider also retains all rights not expressed in the agreement including advertising rights.
                        </li>
                        ${copyright.photoCredit ? `
                        <li style="margin-bottom: 12px; line-height: 1.8;">
                            The Client agrees to give the Service Provider proper photo credit on each reprint as follows: <strong>${copyright.photoCredit}</strong>
                        </li>
                        ` : ''}
                    </ul>
                    ${copyright.licensingTerms ? `
                    <div style="margin-left: 24px; margin-top: 16px;">
                        <p class="agreement-text">${copyright.licensingTerms}</p>
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                <!-- Disclaimer -->
                ${disclaimer.text ? `
                <div class="disclaimer-section">
                    <h3 class="section-title">Disclaimer</h3>
                    <p class="section-content" style="font-size: 12px; font-style: italic;">${disclaimer.text}</p>
                </div>
                ` : ''}

                <!-- Signatures -->
                <div class="signature-section">
                    <div class="signatures">
                        <div class="signature-block">
                            <p class="signature-label">Client Signature</p>
                            <div class="signature-line"></div>
                            <p class="signature-name">${clientName}</p>
                            <p class="signature-date">Date: _____________</p>
                        </div>
                        <div class="signature-block">
                            <p class="signature-label">Service Provider Signature</p>
                            <div class="signature-line"></div>
                            <p class="signature-name">${studioName}</p>
                            <p class="signature-date">Date: _____________</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

export async function generateContractPDFFromPreview(contractData: any, quotationData: any = null): Promise<string> {
    const html = generateContractHTMLFromPreview(contractData, quotationData);
    const buffer = await convertHtmlToPdf(html);
    const url = await uploadPdfToDigitalOcean(buffer, contractData.agreement?.corporationName || quotationData?.client?.name || 'contract', 'contract');
    return url;
}

