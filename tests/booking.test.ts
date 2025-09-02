import { test, expect, Page } from '@playwright/test';

test.describe('TandemUp Booking Functionality', () => {
  // Helper function to check if user is logged in and navigate to booking
  async function navigateToBooking(page: Page) {
    await page.goto('/');
    
    // Check if user is already logged in by looking for user profile dropdown
    try {
      const userDropdown = page.locator('button:has-text("JanTrial"), .user-dropdown, [data-testid="user-dropdown"]');
      await expect(userDropdown).toBeVisible({ timeout: 5000 });
      console.log('User already logged in');
      
      // Navigate to booking page
      await page.goto('/book');
      return;
    } catch {
      throw new Error('User not logged in. Please ensure the application is running with the test user authenticated.');
    }
  }

  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should successfully navigate to booking page', async ({ page }) => {
    await navigateToBooking(page);
    
    await expect(page).toHaveURL(/.*\/book/);
    
    // Verify page elements are loaded
    await expect(page.locator('text="Book a Session"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="Select Date & Time"')).toBeVisible({ timeout: 5000 });
  });

  test('should display available time slots', async ({ page }) => {
    await navigateToBooking(page);
    
    // Wait for time slots to load
    await page.waitForLoadState('networkidle');
    
    // Check for time slot containers or calendar elements
    const timeSlots = page.locator('[data-testid="time-slot"], .time-slot, button:has-text(":")');
    await expect(timeSlots.first()).toBeVisible({ timeout: 15000 });
    
    // Verify at least one time slot is present
    const slotCount = await timeSlots.count();
    expect(slotCount).toBeGreaterThan(0);
  });

  test('should open booking modal when clicking on an available time slot', async ({ page }) => {
    await navigateToBooking(page);
    await page.goto('/book');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Find an available time slot (not disabled)
    const availableSlots = page.locator('[data-testid="time-slot"]:not([disabled]), .time-slot:not([disabled]), button:has-text(":"):not([disabled])');
    await expect(availableSlots.first()).toBeVisible({ timeout: 15000 });
    
    // Click on the first available slot
    await availableSlots.first().click();
    
    // Verify booking modal opens
    const modal = page.locator('.modal-open, [data-testid="booking-modal"], .booking-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Verify modal contains expected elements
    await expect(page.locator('text="Book New Session", text="Book Session", text="Join Session"')).toBeVisible();
    await expect(page.locator('button:has-text("Book Session"), button:has-text("Join Session")')).toBeVisible();
  });

  test('should allow duration selection in booking modal', async ({ page }) => {
    await navigateToBooking(page);
    await page.goto('/book');
    await page.waitForLoadState('networkidle');
    
    // Click on an available time slot
    const availableSlots = page.locator('[data-testid="time-slot"]:not([disabled]), .time-slot:not([disabled]), button:has-text(":"):not([disabled])');
    await availableSlots.first().click();
    
    // Wait for modal to open
    const modal = page.locator('.modal-open, [data-testid="booking-modal"]');
    await expect(modal).toBeVisible();
    
    // Check for duration selection buttons
    const duration25 = page.locator('button:has-text("25"), button:has-text("25 min")');
    const duration50 = page.locator('button:has-text("50"), button:has-text("50 min")');
    
    // Verify duration buttons exist (if not joining an existing session)
    if (await duration25.count() > 0) {
      await expect(duration25).toBeVisible();
      await expect(duration50).toBeVisible();
      
      // Test duration selection
      await duration25.click();
      await expect(duration25).toHaveClass(/btn-primary|selected|active/);
      
      await duration50.click();
      await expect(duration50).toHaveClass(/btn-primary|selected|active/);
    }
  });

  test('should successfully book a session without authorization errors', async ({ page }) => {
    await navigateToBooking(page);
    await page.waitForLoadState('networkidle');
    
    // Listen for API responses to check for errors
    const bookingRequests: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/sessions/book')) {
        bookingRequests.push({
          status: response.status(),
          url: response.url()
        });
      }
    });
    
    // Click on a future available time slot (10:00 AM or later)
    const futureSlots = page.locator('button:has-text("10:00 Available"), button:has-text("11:00 Available"), button:has-text("12:00 Available")');
    await futureSlots.first().click();
    
    // Wait for modal and book the session
    const modal = page.locator('.modal-open, [data-testid="booking-modal"]');
    await expect(modal).toBeVisible();
    
    // Select 25-minute duration if available
    const duration25 = page.locator('button:has-text("25"), button:has-text("25 min")');
    if (await duration25.count() > 0) {
      await duration25.click();
    }
    
    // Click the book/join button
    const bookButton = page.locator('button:has-text("Book Session"), button:has-text("Join Session")');
    await bookButton.click();
    
    // Wait for the booking request to complete
    await page.waitForTimeout(3000);
    
    // Check that no authorization errors occurred
    for (const request of bookingRequests) {
      expect(request.status).not.toBe(401); // Unauthorized
      expect(request.status).not.toBe(403); // Forbidden
    }
    
    // Verify successful booking (modal should close or show success)
    try {
      // Either modal closes (successful booking) or shows success message
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Or check for success message in modal
      await expect(page.locator('text="Success", text="Booked", .alert-success')).toBeVisible();
    }
    
    // Verify no error messages are displayed
    const errorMessages = page.locator('.alert-error, .error, text="unauthorized" i, text="Assignment to constant variable"');
    await expect(errorMessages).not.toBeVisible();
  });

  test('should handle booking errors gracefully', async ({ page }) => {
    await navigateToBooking(page);
    await page.goto('/book');
    await page.waitForLoadState('networkidle');
    
    // Click on an available time slot
    const availableSlots = page.locator('[data-testid="time-slot"]:not([disabled]), .time-slot:not([disabled]), button:has-text(":"):not([disabled])');
    await availableSlots.first().click();
    
    // Wait for modal
    const modal = page.locator('.modal-open, [data-testid="booking-modal"]');
    await expect(modal).toBeVisible();
    
    // Mock a network error by intercepting the booking request
    await page.route('/api/sessions/book', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test network error' })
      });
    });
    
    // Try to book
    const bookButton = page.locator('button:has-text("Book Session"), button:has-text("Join Session")');
    await bookButton.click();
    
    // Verify error handling
    await expect(page.locator('.alert-error, .error')).toBeVisible({ timeout: 5000 });
    
    // Modal should remain open to allow retry
    await expect(modal).toBeVisible();
  });

  test('should close modal when cancel button is clicked', async ({ page }) => {
    await navigateToBooking(page);
    await page.goto('/book');
    await page.waitForLoadState('networkidle');
    
    // Click on an available time slot
    const availableSlots = page.locator('[data-testid="time-slot"]:not([disabled]), .time-slot:not([disabled]), button:has-text(":"):not([disabled])');
    await availableSlots.first().click();
    
    // Wait for modal
    const modal = page.locator('.modal-open, [data-testid="booking-modal"]');
    await expect(modal).toBeVisible();
    
    // Click cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();
    
    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });

  test('should display session structure information in modal', async ({ page }) => {
    await navigateToBooking(page);
    await page.goto('/book');
    await page.waitForLoadState('networkidle');
    
    // Click on an available time slot
    const availableSlots = page.locator('[data-testid="time-slot"]:not([disabled]), .time-slot:not([disabled]), button:has-text(":"):not([disabled])');
    await availableSlots.first().click();
    
    // Wait for modal
    const modal = page.locator('.modal-open, [data-testid="booking-modal"]');
    await expect(modal).toBeVisible();
    
    // Check for session structure information
    await expect(page.locator('text="Check-in", text="Focus time", text="Check-out"')).toBeVisible();
    await expect(page.locator('text="cameras on"')).toBeVisible();
  });

  test('should show join session option for waiting sessions', async ({ page }) => {
    await navigateToBooking(page);
    await page.goto('/book');
    await page.waitForLoadState('networkidle');
    
    // Look for waiting sessions (slots with existing users)
    const waitingSlots = page.locator('[data-status="waiting"], .waiting, button:has(.badge):has-text("Waiting")');
    
    if (await waitingSlots.count() > 0) {
      await waitingSlots.first().click();
      
      const modal = page.locator('.modal-open, [data-testid="booking-modal"]');
      await expect(modal).toBeVisible();
      
      // Should show join session instead of book new session
      await expect(page.locator('text="Join Session"')).toBeVisible();
      await expect(page.locator('text="Partner:", text="Instant Match"')).toBeVisible();
      
      // Duration selection should not be available (inherit from waiting user)
      const durationButtons = page.locator('button:has-text("25 min"), button:has-text("50 min")');
      await expect(durationButtons).not.toBeVisible();
    }
  });
});