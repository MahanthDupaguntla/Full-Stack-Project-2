package com.artforge.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "artworks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Artwork {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 100)
    private String artist;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer year;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(length = 50)
    private String category;

    @Column(name = "cultural_history", columnDefinition = "TEXT")
    private String culturalHistory;

    @Column(name = "curator_insight", columnDefinition = "TEXT")
    private String curatorInsight;

    @Column(name = "is_auction")
    @Builder.Default
    private Boolean isAuction = false;

    @Column(name = "current_bid", precision = 12, scale = 2)
    private BigDecimal currentBid;

    @Column(name = "bid_end_time")
    private LocalDateTime bidEndTime;

    // Expose owner as a simple object without circular refs
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnoreProperties({"password","transactions","hibernateLazyInitializer","handler"})
    private User owner;

    @Column(name = "current_owner_name", length = 100)
    private String currentOwnerName;

    @Column(name = "is_listed")
    @Builder.Default
    private Boolean isListed = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Managed reference breaks the cycle
    @JsonManagedReference
    @OneToMany(mappedBy = "artwork", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Bid> bids = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}
