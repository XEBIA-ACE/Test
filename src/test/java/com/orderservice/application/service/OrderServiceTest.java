package com.orderservice.application.service;

import com.orderservice.application.dto.CreateOrderRequest;
import com.orderservice.application.dto.OrderItemRequest;
import com.orderservice.application.dto.OrderResponse;
import com.orderservice.application.dto.UpdateOrderStatusRequest;
import com.orderservice.application.exception.OrderNotFoundException;
import com.orderservice.application.mapper.OrderMapper;
import com.orderservice.domain.model.Order;
import com.orderservice.domain.model.OrderStatus;
import com.orderservice.infrastructure.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderService.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderMapper orderMapper;

    @InjectMocks
    private OrderService orderService;

    private CreateOrderRequest createOrderRequest;
    private Order order;
    private OrderResponse orderResponse;

    @BeforeEach
    void setUp() {
        // Setup test data
        OrderItemRequest itemRequest = OrderItemRequest.builder()
            .productId(1L)
            .productName("Test Product")
            .productSku("TEST-001")
            .quantity(2)
            .unitPrice(new BigDecimal("50.00"))
            .build();

        createOrderRequest = CreateOrderRequest.builder()
            .customerId(1L)
            .customerName("John Doe")
            .customerEmail("john.doe@example.com")
            .currency("USD")
            .shippingAddress("123 Main St")
            .items(List.of(itemRequest))
            .build();

        order = Order.builder()
            .id(1L)
            .orderNumber("ORD-20240101-ABC123")
            .customerId(1L)
            .customerName("John Doe")
            .customerEmail("john.doe@example.com")
            .status(OrderStatus.PENDING)
            .totalAmount(new BigDecimal("100.00"))
            .currency("USD")
            .build();

        orderResponse = OrderResponse.builder()
            .id(1L)
            .orderNumber("ORD-20240101-ABC123")
            .customerId(1L)
            .customerName("John Doe")
            .customerEmail("john.doe@example.com")
            .status(OrderStatus.PENDING)
            .totalAmount(new BigDecimal("100.00"))
            .currency("USD")
            .build();
    }

    @Test
    @DisplayName("Should create order successfully")
    void shouldCreateOrderSuccessfully() {
        // Given
        when(orderMapper.toEntity(any(CreateOrderRequest.class))).thenReturn(order);
        when(orderRepository.existsByOrderNumber(anyString())).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(any(Order.class))).thenReturn(orderResponse);

        // When
        OrderResponse result = orderService.createOrder(createOrderRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getOrderNumber()).isEqualTo("ORD-20240101-ABC123");
        assertThat(result.getCustomerId()).isEqualTo(1L);
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Should get order by ID successfully")
    void shouldGetOrderByIdSuccessfully() {
        // Given
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(orderResponse);

        // When
        OrderResponse result = orderService.getOrderById(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(orderRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw OrderNotFoundException when order not found")
    void shouldThrowOrderNotFoundExceptionWhenOrderNotFound() {
        // Given
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> orderService.getOrderById(999L))
            .isInstanceOf(OrderNotFoundException.class)
            .hasMessageContaining("Order not found with ID: 999");

        verify(orderRepository, times(1)).findById(999L);
    }

    @Test
    @DisplayName("Should update order status successfully")
    void shouldUpdateOrderStatusSuccessfully() {
        // Given
        UpdateOrderStatusRequest statusRequest = UpdateOrderStatusRequest.builder()
            .status(OrderStatus.CONFIRMED)
            .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(any(Order.class))).thenReturn(orderResponse);

        // When
        OrderResponse result = orderService.updateOrderStatus(1L, statusRequest);

        // Then
        assertThat(result).isNotNull();
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Should cancel order successfully")
    void shouldCancelOrderSuccessfully() {
        // Given
        order.setStatus(OrderStatus.PENDING);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(any(Order.class))).thenReturn(orderResponse);

        // When
        OrderResponse result = orderService.cancelOrder(1L);

        // Then
        assertThat(result).isNotNull();
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Should throw exception when cancelling shipped order")
    void shouldThrowExceptionWhenCancellingShippedOrder() {
        // Given
        order.setStatus(OrderStatus.SHIPPED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        // When & Then
        assertThatThrownBy(() -> orderService.cancelOrder(1L))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot cancel order in SHIPPED status");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Should delete order successfully")
    void shouldDeleteOrderSuccessfully() {
        // Given
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        doNothing().when(orderRepository).delete(any(Order.class));

        // When
        orderService.deleteOrder(1L);

        // Then
        verify(orderRepository, times(1)).delete(any(Order.class));
    }
}
