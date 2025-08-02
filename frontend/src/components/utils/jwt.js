class JWTService {
  decodeToken(token) {
    try {
      if (!token || typeof token !== "string") return null;

      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  isTokenExpired(token) {
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const bufferTime = 30 * 1000;
    return decoded.exp * 1000 < Date.now() + bufferTime;
  }

  getTimeUntilExpiry(token) {
    if (!token) return 0;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 0;

    return Math.max(0, decoded.exp * 1000 - Date.now());
  }

  /**
   * Настройка автоматического обновления токена
   * @param {Function} refreshCallback - Функция для обновления токена
   * @param {string} token - JWT токен (опционально, если не передан - берется из localStorage)
   */
  setupTokenRefresh(refreshCallback, token = null) {
    const authToken = token || localStorage.getItem("authToken");
    if (!authToken || !refreshCallback) return;

    const timeUntilExpiry = this.getTimeUntilExpiry(authToken);

    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime > 0) {
      console.log(
        `🔄 Token refresh scheduled in ${Math.floor(
          refreshTime / 1000 / 60
        )} minutes`
      );

      setTimeout(() => {
        console.log("🔄 Auto-refreshing token...");
        refreshCallback();
      }, refreshTime);
    } else if (timeUntilExpiry > 0) {
      console.log("⚠️ Token expires soon, refreshing immediately");
      refreshCallback();
    }
  }

  clearAuth() {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("refreshToken");
      console.log("🧹 Auth data cleared");
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  }

  getTokenInfo(token = null) {
    const authToken = token || localStorage.getItem("authToken");
    if (!authToken) return null;

    const decoded = this.decodeToken(authToken);
    if (!decoded) return null;

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      subscription: decoded.subscription,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : null,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
      timeUntilExpiry: this.getTimeUntilExpiry(authToken),
      isExpired: this.isTokenExpired(authToken),
    };
  }

  isTokenValid(token = null) {
    const authToken = token || localStorage.getItem("authToken");
    if (!authToken) return false;

    const decoded = this.decodeToken(authToken);
    if (!decoded) return false;

    return !this.isTokenExpired(authToken);
  }

  getFormattedTimeUntilExpiry(token = null) {
    const timeMs = this.getTimeUntilExpiry(token);
    if (timeMs <= 0) return "Expired";

    const minutes = Math.floor(timeMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }
}

export default new JWTService();
