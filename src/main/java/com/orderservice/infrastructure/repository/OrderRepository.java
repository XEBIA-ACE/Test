package com.orderservice.infrastructure.repository;

import com.orderservice.domain.model.Order;
import com.orderservice.domain.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Order entity.
 * Provides data access operations for orders.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Find order by order number.
     */
    Optional<Order> findByOrderNumber(String orderNumber);

    /**
     * Find all orders by customer ID with pagination.
     */
    Page<Order> findByCustomerId(Long customerId, Pageable pageable);

    /**
     * Find all orders by status with pagination.
     */
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    /**
     * Find all orders by customer ID and status.
     */
    List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status);

    /**
     * Find orders created within a date range.
     */
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
    List<Order> findOrdersByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find orders by customer email.
     */
    List<Order> findByCustomerEmail(String email);

    /**
     * Check if order number exists.
     */
    boolean existsByOrderNumber(String orderNumber);

    /**
     * Count orders by status.
     */
    long countByStatus(OrderStatus status);

    /**
     * Count orders by customer ID.
     */
    long countByCustomerId(Long customerId);
}
