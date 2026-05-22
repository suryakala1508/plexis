

export interface LoginResponse {
    success: boolean;
    message: string;
    isAdmin?: boolean;  // Present when logging in as admin
}

export interface UserData{
    _id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email: string;
    password?: string;
    countryCode?: string;
    role: string;
    refNo: string;
    googleId?: string;
    isOnboared?: boolean;
    validUntil?: Date;
    subscription?: {
        planType?: string;
        status?: string;
        features?: Record<string, boolean>;
        updatedAt?: Date;
    };
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    user?: {
        email: string;
        isOnboarded: boolean;
    };
}