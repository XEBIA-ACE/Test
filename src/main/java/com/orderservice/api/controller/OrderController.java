package com.orderservice.api.controller;

import com.orderservice.application.dto.*;
import com.orderservice.application.service.OrderService;
import com.orderservice.domain.model.OrderStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST API controller for order management operations.
 * Provides endpoints for creating, retrieving, updating, and deleting orders.
 */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Order Management", description = "APIs for managing orders")
public class OrderController {

    private final OrderService orderService;

    /**
     * Create a new order.
     */
    @PostMapping
    @Operation(summary = "Create a new order", description = "Creates a new order with the provided details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Order created successfully",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Duplicate order number")
    })
    public ResponseEntity<OrderResponse> createOrder(
        @Valid @RequestBody CreateOrderRequest request
    ) {
        log.info("POST /api/v1/orders - Creating new order for customer: {}", request.getCustomerId());
        OrderResponse response = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get order by ID.
     */
    @GetMapping("/{orderId}")
    @Operation(summary = "Get order by ID", description = "Retrieves order details by order ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Order found",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> getOrderById(
        @Parameter(description = "Order ID", required = true)
        @PathVariable Long orderId
    ) {
        log.info("GET /api/v1/orders/{} - Fetching order", orderId);
        OrderResponse response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get order by order number.
     */
    @GetMapping("/by-order-number/{orderNumber}")
    @Operation(summary = "Get order by order number", description = "Retrieves order details by order number")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Order found",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> getOrderByOrderNumber(
        @Parameter(description = "Order number", required = true)
        @PathVariable String orderNumber
    ) {
        log.info("GET /api/v1/orders/by-order-number/{} - Fetching order", orderNumber);
        OrderResponse response = orderService.getOrderByOrderNumber(orderNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all orders with pagination.
     */
    @GetMapping
    @Operation(summary = "Get all orders", description = "Retrieves all orders with pagination")
    @ApiResponse(responseCode = "200", description = "Orders retrieved successfully")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable
    ) {
        log.info("GET /api/v1/orders - Fetching all orders");
        Page<OrderResponse> orders = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get orders by customer ID.
     */
    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get orders by customer", description = "Retrieves all orders for a specific customer")
    @ApiResponse(responseCode = "200", description = "Orders retrieved successfully")
    public ResponseEntity<Page<OrderResponse>> getOrdersByCustomerId(
        @Parameter(description = "Customer ID", required = true)
        @PathVariable Long customerId,
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable
    ) {
        log.info("GET /api/v1/orders/customer/{} - Fetching customer orders", customerId);
        Page<OrderResponse> orders = orderService.getOrdersByCustomerId(customerId, pageable);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get orders by status.
     */
    @GetMapping("/status/{status}")
    @Operation(summary = "Get orders by status", description = "Retrieves all orders with a specific status")
    @ApiResponse(responseCode = "200", description = "Orders retrieved successfully")
    public ResponseEntity<Page<OrderResponse>> getOrdersByStatus(
        @Parameter(description = "Order status", required = true)
        @PathVariable OrderStatus status,
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable
    ) {
        log.info("GET /api/v1/orders/status/{} - Fetching orders by status", status);
        Page<OrderResponse> orders = orderService.getOrdersByStatus(status, pageable);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get orders by date range.
     */
    @GetMapping("/date-range")
    @Operation(summary = "Get orders by date range", description = "Retrieves orders within a date range")
    @ApiResponse(responseCode = "200", description = "Orders retrieved successfully")
    public ResponseEntity<List<OrderResponse>> getOrdersByDateRange(
        @Parameter(description = "Start date (ISO format)", required = true)
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @Parameter(description = "End date (ISO format)", required = true)
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET /api/v1/orders/date-range - Fetching orders from {} to {}", startDate, endDate);
        List<OrderResponse> orders = orderService.getOrdersByDateRange(startDate, endDate);
        return ResponseEntity.ok(orders);
    }

    /**
     * Update order status.
     */
    @PatchMapping("/{orderId}/status")
    @Operation(summary = "Update order status", description = "Updates the status of an existing order")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Order status updated successfully",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "404", description = "Order not found"),
        @ApiResponse(responseCode = "400", description = "Invalid status")
    })
    public ResponseEntity<OrderResponse> updateOrderStatus(
        @Parameter(description = "Order ID", required = true)
        @PathVariable Long orderId,
        @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        log.info("PATCH /api/v1/orders/{}/status - Updating order status to {}",
            orderId, request.getStatus());
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel order.
     */
    @PostMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel order", description = "Cancels an existing order")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Order cancelled successfully",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "404", description = "Order not found"),
        @ApiResponse(responseCode = "400", description = "Order cannot be cancelled")
    })
    public ResponseEntity<OrderResponse> cancelOrder(
        @Parameter(description = "Order ID", required = true)
        @PathVariable Long orderId
    ) {
        log.info("POST /api/v1/orders/{}/cancel - Cancelling order", orderId);
        OrderResponse response = orderService.cancelOrder(orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete order.
     */
    @DeleteMapping("/{orderId}")
    @Operation(summary = "Delete order", description = "Deletes an existing order")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Order deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<Void> deleteOrder(
        @Parameter(description = "Order ID", required = true)
        @PathVariable Long orderId
    ) {
        log.info("DELETE /api/v1/orders/{} - Deleting order", orderId);
        orderService.deleteOrder(orderId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get order count by status.
     */
    @GetMapping("/count/status/{status}")
    @Operation(summary = "Count orders by status", description = "Returns the count of orders with a specific status")
    @ApiResponse(responseCode = "200", description = "Count retrieved successfully")
    public ResponseEntity<Long> countOrdersByStatus(
        @Parameter(description = "Order status", required = true)
        @PathVariable OrderStatus status
    ) {
        log.info("GET /api/v1/orders/count/status/{} - Counting orders", status);
        long count = orderService.countOrdersByStatus(status);
        return ResponseEntity.ok(count);
    }

    /**
     * Get order count by customer.
     */
    @GetMapping("/count/customer/{customerId}")
    @Operation(summary = "Count orders by customer", description = "Returns the count of orders for a specific customer")
    @ApiResponse(responseCode = "200", description = "Count retrieved successfully")
    public ResponseEntity<Long> countOrdersByCustomer(
        @Parameter(description = "Customer ID", required = true)
        @PathVariable Long customerId
    ) {
        log.info("GET /api/v1/orders/count/customer/{} - Counting customer orders", customerId);
        long count = orderService.countOrdersByCustomer(customerId);
        return ResponseEntity.ok(count);
    }
}
