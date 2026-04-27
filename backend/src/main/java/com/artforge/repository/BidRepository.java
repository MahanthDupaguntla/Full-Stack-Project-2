package com.artforge.repository;

import com.artforge.model.Artwork;
import com.artforge.model.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BidRepository extends JpaRepository<Bid, String> {
    List<Bid> findByArtworkIdOrderByAmountDesc(String artworkId);
    List<Bid> findByBidderId(String bidderId);
    void deleteByArtwork(Artwork artwork);
}
