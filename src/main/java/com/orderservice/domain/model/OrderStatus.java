package com.orderservice.domain.model;

/**
 * Enumeration representing the various states of an order lifecycle.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REFUNDED
}
