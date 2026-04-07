package com.artforge.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @JsonIgnore  // Never expose password
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.VISITOR;

    @Column(length = 500)
    private String avatar;

    @Column(name = "wallet_balance", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal walletBalance = new BigDecimal("50000.00");

    @Column(length = 50)
    @Builder.Default
    private String subscription = "Basic";

    @Column(name = "joined_date")
    private LocalDateTime joinedDate;

    @Column(name = "total_earned", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalEarned = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @JsonIgnore  // Prevent circular ref
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Transaction> transactions = new ArrayList<>();

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.joinedDate == null) this.joinedDate = LocalDateTime.now();
    }
}
