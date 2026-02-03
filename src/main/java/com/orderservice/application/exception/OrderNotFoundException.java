package com.orderservice.application.exception;

/**
 * Exception thrown when an order is not found.
 */
public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException(String message) {
        super(message);
    }

    public OrderNotFoundException(Long orderId) {
        super(String.format("Order not found with ID: %d", orderId));
    }

    public OrderNotFoundException(String fieldName, String fieldValue) {
        super(String.format("Order not found with %s: %s", fieldName, fieldValue));
    }
}
