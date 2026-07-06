package org.simpleapp.project;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Maps project read-path failures to HTTP responses (US-003).
 *
 * <p>401 unauthenticated (FR-009), 403 access denied (FR-006), 404 not found
 * (FR-007). Error bodies for 403/404 carry no project attributes so existence
 * and content are not leaked (EC-003).
 */
@ControllerAdvice(assignableTypes = ProjectController.class)
public class ProjectExceptionHandler {

    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthenticated(UnauthenticatedException ex) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(ProjectNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ProjectNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    private ResponseEntity<Map<String, String>> build(HttpStatus status, String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
