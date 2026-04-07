package com.artforge.repository;

import com.artforge.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByUserIdOrderByDateDesc(String userId);
}
