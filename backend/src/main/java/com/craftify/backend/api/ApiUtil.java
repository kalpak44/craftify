package com.craftify.backend.api;

import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.request.NativeWebRequest;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Optional;

/**
 * Utility used by generated API interfaces to write example responses.
 * Called from default methods when no controller implementation exists.
 */
public final class ApiUtil {

    private static final Logger log = LoggerFactory.getLogger(ApiUtil.class);

    private ApiUtil() {
        // Utility class — no instances.
    }

    /**
     * Writes an example response to the underlying HttpServletResponse.
     *
     * @param request     current NativeWebRequest
     * @param mediaType   e.g. "application/json"
     * @param exampleBody Example body (stringifies JSON or text)
     */
    public static void setExampleResponse(NativeWebRequest request, String mediaType, String exampleBody) {
        Optional.ofNullable(request.getNativeResponse(HttpServletResponse.class)).ifPresent(response -> {
            try {
                if (response.isCommitted()) {
                    log.debug("Response already committed, skipping example body.");
                    return;
                }
                response.setContentType(mediaType);
                response.setCharacterEncoding("UTF-8");
                try (PrintWriter writer = response.getWriter()) {
                    writer.print(exampleBody);
                    writer.flush();
                }
                log.trace("Example response written with mediaType={} length={}", mediaType, exampleBody.length());
            } catch (IOException ex) {
                log.warn("Failed to write example response: {}", ex.getMessage(), ex);
            }
        });
    }
}
