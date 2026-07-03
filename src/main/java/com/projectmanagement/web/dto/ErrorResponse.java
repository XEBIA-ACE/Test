package com.projectmanagement.web.dto;

/**
 * Generic API error response body.
 */
public class ErrorResponse {

    private int status;
    private String error;
    private String message;
    private String path;

    public ErrorResponse() {}

    public ErrorResponse(int status, String error, String message, String path) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }

    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
    public String getPath() { return path; }
}
