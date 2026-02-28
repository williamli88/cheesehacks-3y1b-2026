package com.clothingswap.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "swipe_ledger")
public class SwipeLedger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userIdFrom;
    private Long itemIdTo;
    private String action; // RIGHT or LEFT
    private LocalDateTime timestamp;

    public SwipeLedger() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserIdFrom() { return userIdFrom; }
    public void setUserIdFrom(Long userIdFrom) { this.userIdFrom = userIdFrom; }

    public Long getItemIdTo() { return itemIdTo; }
    public void setItemIdTo(Long itemIdTo) { this.itemIdTo = itemIdTo; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    @PrePersist
    public void prePersist() {
        timestamp = LocalDateTime.now();
    }
}
