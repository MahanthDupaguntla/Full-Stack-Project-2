// This file is intentionally left minimal — OTP service was removed.
// Delete this file if no longer needed.
package com.artforge.service;

import org.springframework.stereotype.Service;

/**
 * Placeholder — OTP verification has been disabled.
 * Login/register returns JWT tokens directly without email verification.
 */
@Service
public class OtpService {
    // No-op — kept as empty bean to prevent Spring wiring errors
    // if any other component still references it.
}
