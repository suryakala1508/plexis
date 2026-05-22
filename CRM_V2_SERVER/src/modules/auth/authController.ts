import { LoginResponse, RegisterResponse, UserData } from "../../types/authTypes";
import { Request, Response } from "express";
import { AuthRequest } from "../../core/middleware";

import jwt from "jsonwebtoken";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { Token } from "../../types/token";
import { ENV } from "../../config/env";
import { User } from "../../models/userModel";
import { OAuth2Client } from "google-auth-library";
import { sendMail } from "../../core/services/mailer";
import { createSubscriptionState } from "../../core/services/subscriptionService";
import { Crew } from '../../models/crewModel';
import {AdminModel} from "../../models/adminModel";


export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hashed = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hashed.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, keyHex] = storedHash.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const key = Buffer.from(keyHex, "hex");
  const hashedBuffer = scryptSync(password, salt, 64);
  return timingSafeEqual(hashedBuffer, key);
}

/**
 * Get cookie options based on environment and request
 * @param maxAge - Cookie expiration time in milliseconds
 * @param reqHostname - The hostname from the request
 * @returns Cookie options object
 */
export function getCookieOptions(maxAge: number, httpOnly: boolean = true) {
  const isProduction = ENV.ENVIRONMENT === 'production' || ENV.ENVIRONMENT === 'test';
  
  return {
    httpOnly,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    maxAge,
    path: '/',
  };
}



export const login = async (
  req: Request,
  res: Response<LoginResponse>
) => {
  const { email, password, rememberme } = req.body;

  let userData: UserData | null = await User.findOne({ email });

  let AdminUser = await AdminModel.findOne({ email });

  /* ================= ADMIN LOGIN ================= */
  console.log('🔍 Checking for admin:', { email, adminFound: !!AdminUser });
  
  if (AdminUser) {
    const isCorrect = verifyPassword(password, AdminUser.password);

    if (!isCorrect) {
      return res.status(400).json({
        success: false,
        message: "Please check your email or password is incorrect",
      });
    }

    const AdminPayload: Token = {
      id: AdminUser._id!.toString(),
      refNo: "",
      email: AdminUser.email!,
      role: "100",
    };


    const AdminToken = jwt.sign(AdminPayload, ENV.JWT_SECRET, {
      expiresIn: rememberme ? "7d" : "1d",
    });

    const cookieOptions = getCookieOptions(24 * 60 * 60 * 1000);
    const roleCookieOptions = getCookieOptions(24 * 60 * 60 * 1000, false); // Client-accessible
    
    res.cookie("auth_token", AdminToken, cookieOptions);
    res.cookie("user_role", AdminPayload.role, roleCookieOptions); // ✅ Non-HttpOnly role for frontend 

    return res.json({
      success: true,
      message: "Admin Login successful",
      isAdmin: true  // ✅ Tell client this is an admin
    });
  }

  /* ================= NORMAL USER CHECKS ================= */

  if (!userData) {
    return res.status(400).json({
      success: false,
      message: "Please check your email or password is incorrect",
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required",
    });
  }

  if (!userData.password) {
    return res.status(400).json({
      success: false,
      message:
        "This account uses Google login. Please use Google to sign in.",
    });
  }

  const isMatch = verifyPassword(password, userData.password);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Please check your email or password is incorrect",
    });
  }

  /* ================= CREW FLOW ================= */

  let crewAccount: any | null = null;


  if (String(userData.role) !== "1") {

    crewAccount = await Crew.findOne({
      "contactInfo.email": email,
    });


    if (!crewAccount) {
      return res.status(403).json({
        success: false,
        message: "Crew account not linked",
      });
    }

    const linkedUser = await User.findById(crewAccount.crewToStudio);
  

    if (!linkedUser) {
      return res.status(404).json({
        success: false,
        message: "Studio account not found",
      });
    }

    userData = {
      _id: linkedUser._id?.toString(),
      firstName: linkedUser.firstName ?? undefined,
      lastName: linkedUser.lastName ?? undefined,
      phone: linkedUser.phone ?? undefined,
      email: linkedUser.email!,
      password: linkedUser.password ?? undefined,
      countryCode: linkedUser.countryCode ?? undefined,
      role: linkedUser.role!,
      refNo: linkedUser.refNo!,
      googleId: linkedUser.googleId ?? undefined,
      isOnboared: linkedUser.isOnboared ?? undefined,
      validUntil: linkedUser.validUntil ?? undefined,
    };

  }

  /* ================= TOKEN PAYLOAD ================= */

  let SubscriptionStatus = "Active";

  if (userData.role === "1" && new Date() > userData.validUntil!) {
    SubscriptionStatus =
      userData.validUntil && new Date() <= userData.validUntil
        ? "Active"
        : "Expired";
  }


  const normalizedComponents: any = {};

if (crewAccount?.components instanceof Map) {
  for (const [pageId, comps] of crewAccount.components.entries()) {
    if (comps instanceof Map) {
      for (const [compId, compVal] of comps.entries()) {
        normalizedComponents[compId] = compVal;
      }
    }
  }
}

  const normalizedPages: any = {};
  if (crewAccount?.pages instanceof Map) {
    for (const [key, val] of crewAccount.pages.entries()) {
      normalizedPages[key] = val;
    }
  } else if (crewAccount?.pages) {
    Object.assign(normalizedPages, crewAccount.pages);
  }

  const payload: Token = {
    id: userData!._id!,
    refNo: userData!.refNo!,
    email: userData!.email!,
    role: crewAccount?.role ?? userData!.role ?? "1",
    pages: normalizedPages,
    components: normalizedComponents,
    subscriptionStatus: SubscriptionStatus,
    validUntil: userData!.validUntil,
    actualUserId: crewAccount?.linkedUser?.toString() || userData!._id?.toString(),
    actualFirstName: crewAccount?.name?.split(' ')[0] || userData!.firstName,
    actualLastName: crewAccount?.name?.split(' ').slice(1).join(' ') || userData!.lastName,
    actualPhone: crewAccount?.contactInfo?.phone || userData!.phone,
    actualEmail: crewAccount?.contactInfo?.email || userData!.email,
  };


  const token = jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: rememberme ? "7d" : "1d",
  });

  const maxAge = rememberme
    ? 7 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;

  res.cookie("auth_token", token, getCookieOptions(maxAge));
  res.cookie("user_role", payload.role, getCookieOptions(maxAge, false)); // ✅ Non-HttpOnly role for frontend

  return res.json({
    success: true,
    message: "Login successful",
  });
};


export const register = async (req: Request, res: Response<RegisterResponse>) => {
  const { email, password } = req.body;


  const existingUser: UserData | null = await User.findOne({ email: email });

  if (existingUser) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }

  let hashedPassword: string = hashPassword(password);

  const newUser = new User({
    email: email,
    password: hashedPassword,
    googleId: "",
    firstName: "",
    lastName: "",
    phone: "",
    refNo: email.split("../.")[0] + Date.now(),
    isOnboared: false,  // Explicitly set to false for new users
    subscription: createSubscriptionState("basic"),
  });




  await newUser.save();


  await sendMail(
  email!,
  "Welcome to PLEXIS!",
  "",

  `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to Plexis</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#F3F4F6;
  font-family:Arial,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0"
style="padding:30px 0; background:#F3F4F6;">

<tr>
<td align="center">

<table width="620" cellpadding="0" cellspacing="0"
style="
  background:#ffffff;
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 4px 12px rgba(0,0,0,0.1);
">

<!-- HEADER -->
<tr>
<td style="
  background:linear-gradient(135deg,#8B5CF6,#6D28D9);
  padding:30px;
">

<table width="100%">
<tr>

<td align="left">

<h2 style="
  margin:0;
  color:white;
  font-size:24px;
">
Studio Name
</h2>

<p style="
  margin:8px 0 0;
  color:rgba(255,255,255,0.85);
  font-size:13px;
  line-height:1.6;
">
Hyderabad, Telangana<br/>
Photography Studio CRM
</p>

</td>

<td align="right">

<div style="
  width:60px;
  height:60px;
  background:white;
  border-radius:12px;
  text-align:center;
  line-height:60px;
  font-weight:bold;
  color:#8B5CF6;
  font-size:24px;
">
S
</div>

</td>

</tr>
</table>

</td>
</tr>

<!-- BODY -->
<tr>
<td style="padding:40px;">

<h1 style="
  margin-top:0;
  color:#111827;
  font-size:28px;
">
Welcome to PLEXIS 🚀
</h1>

<p style="
  color:#4B5563;
  font-size:15px;
  line-height:1.8;
">
Hello USER,
</p>

<p style="
  color:#4B5563;
  font-size:15px;
  line-height:1.8;
">
We're excited to have you onboard with Plexis CRM Platform.
Your account has been successfully created and you can now manage your workflow efficiently.
</p>

<!-- INFO CARD -->
<table width="100%" cellpadding="0" cellspacing="0"
style="
  margin-top:30px;
  background:#FAFAFF;
  border:1px solid #E9D5FF;
  border-radius:12px;
">

<tr>
<td style="
  padding:18px;
">

<p style="
  margin:0;
  font-size:14px;
  color:#111827;
  line-height:1.8;
">

<strong>Email:</strong> ${email}<br/>
<strong>Status:</strong> Active<br/>
<strong>Platform:</strong> Plexis CRM

</p>

</td>
</tr>

</table>

<!-- BUTTON -->
<div style="
  margin-top:35px;
  text-align:center;
">

<a href="http://localhost:5173"
style="
  display:inline-block;
  background:linear-gradient(135deg,#8B5CF6,#6D28D9);
  color:white;
  text-decoration:none;
  padding:14px 32px;
  border-radius:8px;
  font-size:15px;
  font-weight:600;
">
Open Dashboard
</a>

</div>

<p style="
  margin-top:40px;
  color:#6B7280;
  font-size:14px;
  line-height:1.8;
">
If you need any assistance, please contact your studio administrator or the Plexis support team.
</p>

<p style="
  margin-top:30px;
  color:#111827;
  font-size:14px;
  font-weight:600;
">
Regards,<br/>
Plexis Team
</p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="
  background:#111827;
  padding:25px;
">

<table width="100%">

<tr>
<td align="left">

<h3 style="
  margin:0;
  color:white;
  font-size:18px;
">
Plexis Technologies Pvt. Ltd.
</h3>

<p style="
  margin:8px 0 0;
  color:rgba(255,255,255,0.75);
  font-size:13px;
  line-height:1.7;
">
AI Powered CRM Platform for Photography Studios
</p>

</td>
</tr>

</table>

<hr style="
  border:none;
  border-top:1px solid rgba(255,255,255,0.1);
  margin:20px 0;
"/>

<table width="100%">

<tr>

<td align="left">

<p style="
  margin:0;
  color:white;
  font-size:12px;
">
© ${new Date().getFullYear()} Plexis Technologies Pvt. Ltd.
</p>

</td>

<td align="right">

<a href="https://www.instagram.com/plexis.in/"
target="_blank"
style="margin-right:12px; text-decoration:none;">

<img
src="https://cdn-icons-png.flaticon.com/512/174/174855.png"
width="20"
/>

</a>

<a href="https://www.linkedin.com/company/genz-galaxy/"
target="_blank"
style="text-decoration:none;">

<img
src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
width="20"
/>

</a>

</td>

</tr>

</table>

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`
);

  const payload: Token = {
    id: newUser._id!,
    refNo: newUser.refNo!,
    email: newUser.email!,
    role: newUser.role!,
    
  };

  const token: string = jwt.sign(
    payload,
    ENV.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const maxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  res.cookie('auth_token', token, getCookieOptions(maxAge));

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      email: newUser.email,
      isOnboarded: newUser.isOnboared  // Include onboarding status in response
    }
  });
}


export const googleCallback = async (req: Request, res: Response) => {
  try {
    const client = new OAuth2Client(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      ENV.GOOGLE_REDIRECT_URI || undefined
    );

    const { code, token, accessToken, id_token, credential } = req.body as { 
      code?: string; 
      token?: string; 
      accessToken?: string; 
      id_token?: string;
      credential?: string;
    };

    let workingIdToken: string | undefined = id_token || credential || undefined;
    let workingAccessToken: string | undefined = accessToken || undefined;

    if (token) {
      if (token.split('.').length === 3) {
        workingIdToken = token;
      } else {
        workingAccessToken = token;
      }
    }

    if (code && !workingIdToken && !workingAccessToken) {
      try {
        // Direct HTTP request to avoid puppeteer conflict
        const axios = require('axios');
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          code,
          client_id: ENV.GOOGLE_CLIENT_ID,
          client_secret: ENV.GOOGLE_CLIENT_SECRET,
          redirect_uri: ENV.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code'
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (tokenResponse.data.id_token) workingIdToken = tokenResponse.data.id_token;
        if (tokenResponse.data.access_token) workingAccessToken = tokenResponse.data.access_token;
        
        if (!workingIdToken && !workingAccessToken) {
          console.error("Google OAuth: No usable tokens returned", tokenResponse.data);
          return res.status(400).json({ error: "Google login failed: no tokens" });
        }
      } catch (tokenError) {
        console.error("Error exchanging code for tokens:", tokenError);
        return res.status(400).json({ 
          error: "Google login failed: unable to exchange authorization code"
        });
      }
    }

    if (!workingIdToken && !workingAccessToken) {
      return res.status(400).json({ error: "Missing Google authorization code, id_token or access token" });
    }

    let payload: any = null;

    if (workingIdToken) {
      try {
        // Decode JWT manually to avoid puppeteer conflict
        const base64Url = workingIdToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        payload = JSON.parse(jsonPayload);
        
        // Basic validation
        if (!payload.email || !payload.aud || payload.aud !== ENV.GOOGLE_CLIENT_ID) {
          console.error("Invalid token payload:", { email: payload.email, aud: payload.aud });
          return res.status(400).json({ error: "Invalid Google ID token" });
        }
        
        // Check expiration
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          return res.status(400).json({ error: "Google ID token expired" });
        }
      } catch (e) {
        console.error("Error decoding ID token:", e);
        return res.status(400).json({ error: "Invalid Google ID token" });
      }
    } else if (workingAccessToken) {
      try {
        const tokenInfo = await client.getTokenInfo(workingAccessToken);
        let userinfo: any = {};
        try {
          const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${workingAccessToken}` }
          });
          if (resp.ok) {
            userinfo = await resp.json();
          }
        } catch (_) {
        }
        payload = {
          email: userinfo.email || tokenInfo.email,
          given_name: userinfo.given_name,
          family_name: userinfo.family_name,
          sub: userinfo.sub || tokenInfo.sub,
        };
      } catch (e) {
        return res.status(400).json({ error: "Invalid Google access token" });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Google login failed: email not present in token" });
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      try {
        const newUser = new User({
          firstName: payload.given_name ?? "",
          lastName: payload.family_name ?? "",
          phone: "",
          email: payload.email,
          password: "",
          googleId: payload.sub ?? "",
          refNo: payload.email.split("../..")[0] + Date.now(),
        });

        user = await newUser.save();

        try {
          await sendMail(
            user.email!,
            "Welcome to PLEXIS!",
            `Hello ${user.firstName},\n\nWelcome to PLEXIS! We're excited to have you on board.\n\nBest regards,\nThe PLEXIS Team`
          );
        } catch (mailError) {
          console.error("Mail sending error:", mailError);
          // Don't fail the login if email fails
        }
      } catch (createUserError) {
        console.error("User creation error:", createUserError);
        throw createUserError;
      }
    } else if (!user.googleId && payload.sub) {
      try {
        user.googleId = payload.sub;
        await user.save();
      } catch (saveError) {
        console.error("Error saving googleId:", saveError);
        throw saveError;
      }
    }

    const jwtpayload: Token = {
      id: user._id!.toString(),
      refNo: user.refNo!,
      email: user.email!,
      role: user.role!,
      pages: undefined,
      components: undefined
    };

    const jwttoken: string = jwt.sign(jwtpayload, ENV.JWT_SECRET, { expiresIn: "1d" });

    const maxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const cookieOptions = getCookieOptions(maxAge);
    
    res.cookie('auth_token', jwttoken, cookieOptions);
    
    console.log('✅ [googleCallback] Cookie set with options:', {
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite
    });

    const responseUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      isOnboarded: user?.isOnboared,
      email: user.email
    };

    return res.json({ message: "Google login successful", user: responseUser });
  } catch (error: unknown) {
    console.error("Google callback error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(400).json({
      error: "Google login failed",
      reason: errorMessage
    });
  }
};


export const logout = async (req: Request, res: Response) => {
  const authOptions = getCookieOptions(0, true);
  const roleOptions = getCookieOptions(0, false);

  res.clearCookie('auth_token', authOptions);
  res.clearCookie('user_role', roleOptions);

  return res.json({ success: true, message: "Logged out successfully" });
}


export const getAuthToken = async (req: Request, res: Response) => {
  const token = req.cookies.auth_token || req.cookies.guest_search_token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: "No auth token found" });
  }
  return res.json({ success: true, token: token });
};

export const verifySession = async (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
    data: req.data
  });
};

/**
 * Forgot Password - Send reset link to user's email
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Check if user has password (not Google-only account)
    if (!user.password) {
      return res.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    const emailSubject = "Password Reset Request - PLEXIS";
    const emailText = `Hello,\n\nYou requested to reset your password. Please click the link below to reset your password. This link will expire in 30 minutes.\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe PLEXIS Team`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7a0d92;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Please click the button below to reset your password. This link will expire in 30 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #7a0d92; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>If you did not request this, please ignore this email.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">Best regards,<br>The PLEXIS Team</p>
      </div>
    `;

    await sendMail(user.email!, emailSubject, emailText, emailHtml);

    return res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request"
    });
  }
};

/**
 * Reset Password - Verify token and update password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password has been reset successfully. Please login with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
};
