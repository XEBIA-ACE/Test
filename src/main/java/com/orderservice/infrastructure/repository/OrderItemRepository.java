package com.orderservice.infrastructure.repository;

import com.orderservice.domain.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for OrderItem entity.
 * Provides data access operations for order items.
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Find all items for a specific order.
     */
    List<OrderItem> findByOrderId(Long orderId);

    /**
     * Find all items for a specific product.
     */
    List<OrderItem> findByProductId(Long productId);

    /**
     * Count items in an order.
     */
    long countByOrderId(Long orderId);

    /**
     * Get total quantity ordered for a product.
     */
    @Query("SELECT SUM(oi.quantity) FROM OrderItem oi WHERE oi.productId = :productId")
    Long getTotalQuantityByProductId(@Param("productId") Long productId);
}
