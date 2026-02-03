package com.orderservice.application.mapper;

import com.orderservice.application.dto.*;
import com.orderservice.domain.model.Order;
import com.orderservice.domain.model.OrderItem;
import com.orderservice.domain.model.OrderStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Order entities and DTOs.
 * Implements the Adapter pattern for Clean Architecture.
 */
@Component
public class OrderMapper {

    /**
     * Convert CreateOrderRequest to Order entity.
     */
    public Order toEntity(CreateOrderRequest request) {
        Order order = Order.builder()
            .customerId(request.getCustomerId())
            .customerName(request.getCustomerName())
            .customerEmail(request.getCustomerEmail())
            .status(OrderStatus.PENDING)
            .currency(request.getCurrency())
            .shippingAddress(request.getShippingAddress())
            .billingAddress(request.getBillingAddress())
            .notes(request.getNotes())
            .totalAmount(BigDecimal.ZERO)
            .build();

        // Add order items
        List<OrderItem> orderItems = request.getItems().stream()
            .map(this::toOrderItemEntity)
            .collect(Collectors.toList());

        orderItems.forEach(order::addItem);
        order.calculateTotalAmount();

        return order;
    }

    /**
     * Convert OrderItemRequest to OrderItem entity.
     */
    public OrderItem toOrderItemEntity(OrderItemRequest request) {
        OrderItem item = OrderItem.builder()
            .productId(request.getProductId())
            .productName(request.getProductName())
            .productSku(request.getProductSku())
            .quantity(request.getQuantity())
            .unitPrice(request.getUnitPrice())
            .build();

        item.calculateSubtotal();
        return item;
    }

    /**
     * Convert Order entity to OrderResponse.
     */
    public OrderResponse toResponse(Order order) {
        return OrderResponse.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .customerId(order.getCustomerId())
            .customerName(order.getCustomerName())
            .customerEmail(order.getCustomerEmail())
            .status(order.getStatus())
            .totalAmount(order.getTotalAmount())
            .currency(order.getCurrency())
            .shippingAddress(order.getShippingAddress())
            .billingAddress(order.getBillingAddress())
            .notes(order.getNotes())
            .items(toOrderItemResponseList(order.getItems()))
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .build();
    }

    /**
     * Convert OrderItem entity to OrderItemResponse.
     */
    public OrderItemResponse toOrderItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
            .id(item.getId())
            .productId(item.getProductId())
            .productName(item.getProductName())
            .productSku(item.getProductSku())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .subtotal(item.getSubtotal())
            .build();
    }

    /**
     * Convert list of OrderItem entities to list of OrderItemResponse.
     */
    public List<OrderItemResponse> toOrderItemResponseList(List<OrderItem> items) {
        return items.stream()
            .map(this::toOrderItemResponse)
            .collect(Collectors.toList());
    }

    /**
     * Convert list of Order entities to list of OrderResponse.
     */
    public List<OrderResponse> toResponseList(List<Order> orders) {
        return orders.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
}
