package com.artforge.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exhibitions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exhibition {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String theme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curator_id")
    @JsonIgnoreProperties({"password","transactions","hibernateLazyInitializer","handler"})
    private User curator;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExhibitionStatus status = ExhibitionStatus.upcoming;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "exhibition_artworks",
        joinColumns = @JoinColumn(name = "exhibition_id"),
        inverseJoinColumns = @JoinColumn(name = "artwork_id")
    )
    @JsonIgnoreProperties({"bids","owner","hibernateLazyInitializer","handler"})
    @Builder.Default
    private List<Artwork> artworks = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
    }

    public enum ExhibitionStatus {
        active, upcoming, closed
    }
}
