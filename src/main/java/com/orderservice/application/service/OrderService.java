package com.orderservice.application.service;

import com.orderservice.application.dto.*;
import com.orderservice.application.exception.DuplicateOrderException;
import com.orderservice.application.exception.OrderNotFoundException;
import com.orderservice.application.mapper.OrderMapper;
import com.orderservice.domain.model.Order;
import com.orderservice.domain.model.OrderStatus;
import com.orderservice.infrastructure.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Service layer for Order management.
 * Implements business logic and orchestrates data access.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    /**
     * Create a new order.
     */
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating new order for customer: {}", request.getCustomerId());

        // Map DTO to entity
        Order order = orderMapper.toEntity(request);

        // Generate unique order number
        String orderNumber = generateOrderNumber();
        order.setOrderNumber(orderNumber);

        // Validate order number uniqueness
        if (orderRepository.existsByOrderNumber(orderNumber)) {
            throw new DuplicateOrderException(orderNumber);
        }

        // Save order
        Order savedOrder = orderRepository.save(order);

        log.info("Order created successfully with ID: {} and order number: {}",
            savedOrder.getId(), savedOrder.getOrderNumber());

        return orderMapper.toResponse(savedOrder);
    }

    /**
     * Get order by ID.
     */
    public OrderResponse getOrderById(Long orderId) {
        log.debug("Fetching order with ID: {}", orderId);

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        return orderMapper.toResponse(order);
    }

    /**
     * Get order by order number.
     */
    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        log.debug("Fetching order with order number: {}", orderNumber);

        Order order = orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new OrderNotFoundException("order number", orderNumber));

        return orderMapper.toResponse(order);
    }

    /**
     * Get all orders with pagination.
     */
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        log.debug("Fetching all orders with pagination");

        Page<Order> orders = orderRepository.findAll(pageable);
        return orders.map(orderMapper::toResponse);
    }

    /**
     * Get orders by customer ID.
     */
    public Page<OrderResponse> getOrdersByCustomerId(Long customerId, Pageable pageable) {
        log.debug("Fetching orders for customer ID: {}", customerId);

        Page<Order> orders = orderRepository.findByCustomerId(customerId, pageable);
        return orders.map(orderMapper::toResponse);
    }

    /**
     * Get orders by status.
     */
    public Page<OrderResponse> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        log.debug("Fetching orders with status: {}", status);

        Page<Order> orders = orderRepository.findByStatus(status, pageable);
        return orders.map(orderMapper::toResponse);
    }

    /**
     * Update order status.
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        log.info("Updating order status for order ID: {} to {}", orderId, request.getStatus());

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(request.getStatus());

        Order updatedOrder = orderRepository.save(order);

        log.info("Order status updated from {} to {} for order ID: {}",
            oldStatus, request.getStatus(), orderId);

        return orderMapper.toResponse(updatedOrder);
    }

    /**
     * Cancel order.
     */
    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        log.info("Cancelling order with ID: {}", orderId);

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Business rule: Can only cancel orders in PENDING or CONFIRMED status
        if (order.getStatus() != OrderStatus.PENDING &&
            order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException(
                String.format("Cannot cancel order in %s status", order.getStatus())
            );
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order cancelledOrder = orderRepository.save(order);

        log.info("Order cancelled successfully: {}", orderId);

        return orderMapper.toResponse(cancelledOrder);
    }

    /**
     * Delete order (soft delete by marking as cancelled).
     */
    @Transactional
    public void deleteOrder(Long orderId) {
        log.info("Deleting order with ID: {}", orderId);

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        orderRepository.delete(order);

        log.info("Order deleted successfully: {}", orderId);
    }

    /**
     * Get orders within a date range.
     */
    public List<OrderResponse> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Fetching orders between {} and {}", startDate, endDate);

        List<Order> orders = orderRepository.findOrdersByDateRange(startDate, endDate);
        return orderMapper.toResponseList(orders);
    }

    /**
     * Get order statistics by status.
     */
    public long countOrdersByStatus(OrderStatus status) {
        return orderRepository.countByStatus(status);
    }

    /**
     * Get customer order count.
     */
    public long countOrdersByCustomer(Long customerId) {
        return orderRepository.countByCustomerId(customerId);
    }

    /**
     * Generate unique order number.
     * Format: ORD-YYYYMMDD-UUID
     */
    private String generateOrderNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return String.format("ORD-%s-%s", date, uuid);
    }
}
