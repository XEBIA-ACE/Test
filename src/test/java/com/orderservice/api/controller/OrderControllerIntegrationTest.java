package com.orderservice.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orderservice.application.dto.CreateOrderRequest;
import com.orderservice.application.dto.OrderItemRequest;
import com.orderservice.domain.model.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for OrderController.
 * Tests the full application stack with an in-memory H2 database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private CreateOrderRequest createOrderRequest;

    @BeforeEach
    void setUp() {
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
            .shippingAddress("123 Main St, New York, NY 10001")
            .billingAddress("123 Main St, New York, NY 10001")
            .notes("Test order")
            .items(List.of(itemRequest))
            .build();
    }

    @Test
    @DisplayName("Should create order successfully")
    void shouldCreateOrderSuccessfully() throws Exception {
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createOrderRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.orderNumber").exists())
            .andExpect(jsonPath("$.customerId").value(1))
            .andExpect(jsonPath("$.customerName").value("John Doe"))
            .andExpect(jsonPath("$.customerEmail").value("john.doe@example.com"))
            .andExpect(jsonPath("$.status").value(OrderStatus.PENDING.toString()))
            .andExpect(jsonPath("$.totalAmount").value(100.00))
            .andExpect(jsonPath("$.currency").value("USD"))
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items", hasSize(1)));
    }

    @Test
    @DisplayName("Should return validation error for invalid request")
    void shouldReturnValidationErrorForInvalidRequest() throws Exception {
        CreateOrderRequest invalidRequest = CreateOrderRequest.builder()
            .customerId(null) // Missing required field
            .customerName("")
            .customerEmail("invalid-email")
            .currency("US") // Invalid currency format
            .items(List.of())
            .build();

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.validationErrors").exists());
    }

    @Test
    @DisplayName("Should get all orders")
    void shouldGetAllOrders() throws Exception {
        mockMvc.perform(get("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.pageable").exists())
            .andExpect(jsonPath("$.totalElements").exists());
    }

    @Test
    @DisplayName("Should return 404 when order not found")
    void shouldReturn404WhenOrderNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/orders/999999")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.error").value("Not Found"))
            .andExpect(jsonPath("$.message").value("Order not found with ID: 999999"));
    }

    @Test
    @DisplayName("Should get health check status")
    void shouldGetHealthCheckStatus() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.service").exists())
            .andExpect(jsonPath("$.version").exists());
    }
}
