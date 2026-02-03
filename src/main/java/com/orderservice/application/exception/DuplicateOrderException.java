package com.orderservice.application.exception;

/**
 * Exception thrown when attempting to create a duplicate order.
 */
public class DuplicateOrderException extends RuntimeException {

    public DuplicateOrderException(String message) {
        super(message);
    }

    public DuplicateOrderException(String orderNumber) {
        super(String.format("Order already exists with order number: %s", orderNumber));
    }
}
