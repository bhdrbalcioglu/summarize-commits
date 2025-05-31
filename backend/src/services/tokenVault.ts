import { getSupabaseClient } from "../config/supabase.js";
import {
  DatabaseError,
  AuthenticationError,
  ValidationError,
} from "../types/errors.types.js";
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto";
import { environment } from "../config/environment.js";

// Token storage interface
export interface OAuthToken {
  user_id: string;
  provider: "github" | "gitlab";
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: Date;
  scope?: string;
}

// Token with metadata for storage
interface StoredToken extends OAuthToken {
  created_at: string;
  updated_at: string;
}

class TokenVault {
  private supabase = getSupabaseClient("service");
  private readonly ALGORITHM = "aes-256-gcm";
  private readonly IV_LENGTH = 16;
  private readonly SALT_LENGTH = 32;
  private readonly TAG_LENGTH = 16;

  /**
   * Store or update OAuth token for a user
   */
  async storeToken(token: OAuthToken): Promise<void> {
    try {
      this.validateToken(token);

      // Encrypt sensitive token data
      const encryptedAccessToken = this.encrypt(token.access_token);
      const encryptedRefreshToken = token.refresh_token
        ? this.encrypt(token.refresh_token)
        : null;

      const tokenData = {
        user_id: token.user_id,
        provider: token.provider,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_type: token.token_type || "Bearer",
        expires_at: token.expires_at?.toISOString() || null,
        scope: token.scope || null,
      };

      // Upsert token (insert or update if exists)
      const { error } = await this.supabase
        .from("oauth_tokens")
        .upsert(tokenData, {
          onConflict: "user_id,provider",
        });

      if (error) {
        throw new DatabaseError(
          `Failed to store OAuth token: ${error.message}`,
          {
            user_id: token.user_id,
            provider: token.provider,
            error_code: error.code,
          }
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Unexpected error storing OAuth token", {
        user_id: token.user_id,
        provider: token.provider,
        original_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Retrieve OAuth token for a user and provider
   */
  async getToken(
    userId: string,
    provider: "github" | "gitlab"
  ): Promise<OAuthToken | null> {
    try {
      if (!userId || !provider) {
        throw new ValidationError("user_id and provider are required");
      }

      const { data, error } = await this.supabase
        .from("oauth_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", provider)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return null;
        }
        throw new DatabaseError(
          `Failed to retrieve OAuth token: ${error.message}`,
          {
            user_id: userId,
            provider,
            error_code: error.code,
          }
        );
      }

      if (!data) {
        return null;
      }

      // Decrypt sensitive token data
      const decryptedAccessToken = this.decrypt(data.access_token);
      const decryptedRefreshToken = data.refresh_token
        ? this.decrypt(data.refresh_token)
        : undefined;

      // Check if token is expired
      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();

        if (now >= expiresAt) {
          // Token is expired, remove it
          await this.removeToken(userId, provider);
          throw new AuthenticationError("OAuth token has expired", {
            user_id: userId,
            provider,
            expired_at: data.expires_at,
          });
        }
      }

      return {
        user_id: data.user_id,
        provider: data.provider,
        access_token: decryptedAccessToken,
        refresh_token: decryptedRefreshToken,
        token_type: data.token_type,
        expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
        scope: data.scope || undefined,
      };
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof AuthenticationError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw new DatabaseError("Unexpected error retrieving OAuth token", {
        user_id: userId,
        provider,
        original_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Remove OAuth token for a user and provider
   */
  async removeToken(
    userId: string,
    provider: "github" | "gitlab"
  ): Promise<void> {
    try {
      if (!userId || !provider) {
        throw new ValidationError("user_id and provider are required");
      }

      const { error } = await this.supabase
        .from("oauth_tokens")
        .delete()
        .eq("user_id", userId)
        .eq("provider", provider);

      if (error) {
        throw new DatabaseError(
          `Failed to remove OAuth token: ${error.message}`,
          {
            user_id: userId,
            provider,
            error_code: error.code,
          }
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Unexpected error removing OAuth token", {
        user_id: userId,
        provider,
        original_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Remove all tokens for a user (used when user deletes account)
   */
  async removeAllUserTokens(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new ValidationError("user_id is required");
      }

      const { error } = await this.supabase
        .from("oauth_tokens")
        .delete()
        .eq("user_id", userId);

      if (error) {
        throw new DatabaseError(
          `Failed to remove all user tokens: ${error.message}`,
          {
            user_id: userId,
            error_code: error.code,
          }
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Unexpected error removing all user tokens", {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if user has valid token for provider
   */
  async hasValidToken(
    userId: string,
    provider: "github" | "gitlab"
  ): Promise<boolean> {
    try {
      const token = await this.getToken(userId, provider);
      return token !== null;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false; // Token expired or invalid
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Get token expiration info
   */
  async getTokenInfo(
    userId: string,
    provider: "github" | "gitlab"
  ): Promise<{
    exists: boolean;
    expires_at?: Date;
    is_expired: boolean;
    expires_in_minutes?: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("oauth_tokens")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("provider", provider)
        .single();

      if (error || !data) {
        return {
          exists: false,
          is_expired: false,
        };
      }

      const expiresAt = data.expires_at ? new Date(data.expires_at) : undefined;
      const now = new Date();
      const isExpired = expiresAt ? now >= expiresAt : false;
      const expiresInMinutes = expiresAt
        ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000))
        : undefined;

      return {
        exists: true,
        expires_at: expiresAt,
        is_expired: isExpired,
        expires_in_minutes: expiresInMinutes,
      };
    } catch (error) {
      throw new DatabaseError("Unexpected error getting token info", {
        user_id: userId,
        provider,
        original_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  private encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = randomBytes(this.IV_LENGTH);
      const salt = randomBytes(this.SALT_LENGTH);

      const cipher = createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const tag = cipher.getAuthTag();

      // Combine salt + iv + tag + encrypted data
      const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, "hex"),
      ]);

      return combined.toString("base64");
    } catch (error) {
      throw new DatabaseError("Encryption failed", {
        original_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  private decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, "base64");

      // Extract components
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(
        this.SALT_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH
      );
      const tag = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );
      const encrypted = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );

      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, undefined, "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new DatabaseError("Decryption failed", {
        original_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate encryption key from environment secret
   */
  private getEncryptionKey(): Buffer {
    const secret =
      environment.SUPABASE_SERVICE_ROLE_KEY +
      (environment.JWT_SECRET || "fallback-secret");
    return createHash("sha256").update(secret).digest();
  }

  /**
   * Validate token data before storage
   */
  private validateToken(token: OAuthToken): void {
    if (!token.user_id) {
      throw new ValidationError("user_id is required");
    }

    if (!token.provider || !["github", "gitlab"].includes(token.provider)) {
      throw new ValidationError(
        "Valid provider (github or gitlab) is required"
      );
    }

    if (!token.access_token) {
      throw new ValidationError("access_token is required");
    }

    // Validate UUID format for user_id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token.user_id)) {
      throw new ValidationError("user_id must be a valid UUID");
    }

    // Check token length (reasonable limits for Supabase JWTs)
    if (token.access_token.length > 5000) { // Increased for Supabase JWT tokens
      throw new ValidationError("access_token is too long");
    }

    if (token.refresh_token && token.refresh_token.length > 5000) { // Increased for Supabase JWT tokens
      throw new ValidationError("refresh_token is too long");
    }

    // Validate expiration date
    if (token.expires_at && token.expires_at <= new Date()) {
      throw new ValidationError("expires_at must be in the future");
    }
  }
}

// Export singleton instance
export const tokenVault = new TokenVault();
export default tokenVault;
