package com.artforge.service;

import com.artforge.dto.ArtworkRequest;
import com.artforge.model.Artwork;
import com.artforge.model.Bid;
import com.artforge.model.Transaction;
import com.artforge.model.User;
import com.artforge.repository.ArtworkRepository;
import com.artforge.repository.BidRepository;
import com.artforge.repository.TransactionRepository;
import com.artforge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ArtworkService {

    private final ArtworkRepository artworkRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final TransactionRepository transactionRepository;

    public List<Artwork> getAllListed() {
        return artworkRepository.findAll();
    }

    public Artwork getById(String id) {
        return artworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artwork not found"));
    }

    public Artwork create(ArtworkRequest req, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Artwork art = Artwork.builder()
                .title(req.getTitle())
                .artist(req.getArtist() != null ? req.getArtist() : user.getName())
                .description(req.getDescription())
                .year(req.getYear() != null ? req.getYear() : LocalDateTime.now().getYear())
                .imageUrl(req.getImageUrl())
                .price(req.getPrice())
                .category(req.getCategory())
                .isAuction(Boolean.TRUE.equals(req.getIsAuction()))
                .currentBid(Boolean.TRUE.equals(req.getIsAuction()) ? req.getPrice() : null)
                .bidEndTime(Boolean.TRUE.equals(req.getIsAuction())
                        ? LocalDateTime.now().plusHours(req.getAuctionDurationHours())
                        : null)
                .isListed(true)
                .owner(user)
                .currentOwnerName(user.getName())
                .build();

        return artworkRepository.save(art);
    }

    @Transactional
    public Artwork purchase(String artworkId, String buyerEmail) {
        Artwork artwork = getById(artworkId);
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!artwork.getIsListed()) throw new RuntimeException("Artwork not available");
        if (artwork.getIsAuction()) throw new RuntimeException("Use auction bidding instead");
        if (buyer.getWalletBalance().compareTo(artwork.getPrice()) < 0) {
            throw new RuntimeException("Insufficient wallet balance");
        }

        // Deduct buyer wallet
        buyer.setWalletBalance(buyer.getWalletBalance().subtract(artwork.getPrice()));

        // Credit seller if exists
        if (artwork.getOwner() != null && !artwork.getOwner().getId().equals(buyer.getId())) {
            User seller = artwork.getOwner();
            seller.setWalletBalance(seller.getWalletBalance().add(artwork.getPrice()));
            seller.setTotalEarned(seller.getTotalEarned().add(artwork.getPrice()));
            userRepository.save(seller);

            // Seller transaction
            transactionRepository.save(Transaction.builder()
                    .user(seller)
                    .type(Transaction.TransactionType.sale)
                    .amount(artwork.getPrice())
                    .description("Sale of " + artwork.getTitle())
                    .build());
        }

        // Buyer transaction
        transactionRepository.save(Transaction.builder()
                .user(buyer)
                .type(Transaction.TransactionType.purchase)
                .amount(artwork.getPrice())
                .description("Acquisition of " + artwork.getTitle())
                .build());

        // Transfer ownership
        artwork.setIsListed(false);
        artwork.setOwner(buyer);
        artwork.setCurrentOwnerName(buyer.getName());
        userRepository.save(buyer);

        return artworkRepository.save(artwork);
    }

    @Transactional
    public Bid placeBid(String artworkId, BigDecimal amount, String bidderEmail) {
        Artwork artwork = getById(artworkId);
        User bidder = userRepository.findByEmail(bidderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!artwork.getIsAuction()) throw new RuntimeException("Not an auction");
        if (!artwork.getIsListed()) throw new RuntimeException("Auction ended");
        if (artwork.getBidEndTime() != null && artwork.getBidEndTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Auction has ended");
        }
        if (artwork.getCurrentBid() != null && amount.compareTo(artwork.getCurrentBid()) <= 0) {
            throw new RuntimeException("Bid must exceed current bid of " + artwork.getCurrentBid());
        }

        // Bid fee deduction
        BigDecimal bidFee = new BigDecimal("100");
        if (bidder.getWalletBalance().compareTo(bidFee) < 0) {
            throw new RuntimeException("Insufficient balance for bid fee");
        }
        bidder.setWalletBalance(bidder.getWalletBalance().subtract(bidFee));

        transactionRepository.save(Transaction.builder()
                .user(bidder)
                .type(Transaction.TransactionType.bid_fee)
                .amount(bidFee)
                .description("Bid fee for " + artwork.getTitle())
                .build());

        userRepository.save(bidder);

        // Save bid
        Bid bid = Bid.builder()
                .artwork(artwork)
                .bidder(bidder)
                .bidderName(bidder.getName())
                .amount(amount)
                .build();
        bidRepository.save(bid);

        // Update artwork current bid
        artwork.setCurrentBid(amount);
        artworkRepository.save(artwork);

        return bid;
    }

    public List<Artwork> search(String query) {
        return artworkRepository.searchArtworks(query);
    }

    @Transactional
    public Artwork updateListing(String id, boolean isListed, BigDecimal price, String ownerEmail) {
        Artwork artwork = getById(id);
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (artwork.getOwner() == null || !artwork.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can update the listing");
        }

        artwork.setIsListed(isListed);
        if (price != null) {
            artwork.setPrice(price);
        }
        return artworkRepository.save(artwork);
    }
}
