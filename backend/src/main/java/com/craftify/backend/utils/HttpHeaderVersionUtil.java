package com.craftify.backend.utils;

public final class HttpHeaderVersionUtil {

  private HttpHeaderVersionUtil() {}

  public static Integer parseIfMatchVersion(String ifMatch) {
    if (ifMatch == null || ifMatch.isBlank()) {
      return null;
    }
    String cleaned = ifMatch.trim();
    if (cleaned.startsWith("W\"") && cleaned.endsWith("\"")) {
      cleaned = cleaned.substring(2, cleaned.length() - 1);
    }
    if (cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
      cleaned = cleaned.substring(1, cleaned.length() - 1);
    }
    try {
      return Integer.parseInt(cleaned);
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  public static String toWeakEtag(Integer version) {
    int normalized = (version == null) ? 0 : Math.max(version, 0);
    return "W\"" + normalized + "\"";
  }
}
