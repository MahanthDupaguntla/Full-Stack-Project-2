package com.artforge.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bids")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    // Back reference breaks the Artwork <-> Bid cycle
    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artwork_id", nullable = false)
    private Artwork artwork;

    // Only expose basic bidder info, not full user with transactions
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    @JsonIgnoreProperties({"password","transactions","hibernateLazyInitializer","handler"})
    private User bidder;

    @Column(name = "bidder_name", length = 100)
    private String bidderName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.timestamp == null) this.timestamp = LocalDateTime.now();
    }
}
