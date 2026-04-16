package com.artforge.service;

import com.artforge.model.User;
import com.artforge.model.UserRole;
import com.artforge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(String email, User updates) {
        User user = getByEmail(email);
        if (updates.getName() != null) user.setName(updates.getName());
        if (updates.getBio() != null) user.setBio(updates.getBio());
        if (updates.getAvatar() != null) user.setAvatar(updates.getAvatar());
        if (updates.getWalletBalance() != null) {
            user.setWalletBalance(updates.getWalletBalance());
        }
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateRole(String userId, UserRole newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(newRole);
        return userRepository.save(user);
    }
}
