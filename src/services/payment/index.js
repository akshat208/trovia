import { 
  loadRazorpayScript, 
  createRazorpayOrder, 
  initializeRazorpayPayment, 
  verifyAndCompletePayment,
  savePaymentFailureDetails
} from './razorpay';
import { debugRazorpayIntegration, validateFirestoreData } from './debugUtils';
import { auth, db, getSafeDocumentId } from '../../firebase';
import { doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

/**
 * Process payment for a trek booking
 * @param {Object} trekData - Trek details
 * @param {Object} bookingDetails - Booking details
 * @returns {Promise<Object>} - Payment result
 */
export const processPayment = async (trekData, bookingDetails) => {
  try {
    console.group('📊 Payment Processing');
    console.log('Trek Data:', trekData);
    console.log('Booking Details:', bookingDetails);

    const debugInfo = debugRazorpayIntegration();
    if (!debugInfo.isRazorpayLoaded) {
      console.log('🔄 Razorpay not loaded, attempting to load...');
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection and try again.');
      }
    }

    if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
      console.error('❌ Razorpay Key ID is missing');
      throw new Error('Payment configuration error: API key not found.');
    }

    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous-user';

    console.log('👤 User:', user ? `${user.displayName || user.email} (${user.uid})` : 'Anonymous');

    // ★ CRITICAL: Determine the PAYMENT amount (what Razorpay charges)
    // Priority: explicit paymentAmount > amount > calculated from numericPrice
    const paymentAmount = (() => {
      // 1. Explicit payment amount passed from BookingPage
      if (bookingDetails.paymentAmount && bookingDetails.paymentAmount > 0) {
        console.log('💰 Using explicit paymentAmount:', bookingDetails.paymentAmount);
        return parseInt(bookingDetails.paymentAmount);
      }
      // 2. Explicit amount field
      if (bookingDetails.amount && bookingDetails.amount > 0) {
        console.log('💰 Using explicit amount:', bookingDetails.amount);
        return parseInt(bookingDetails.amount);
      }
      // 3. Calculate from trek numericPrice × participants
      const calculated = parseInt(
        (trekData?.numericPrice || 100) * (bookingDetails?.totalParticipants || 1)
      );
      console.log('💰 Calculated from numericPrice:', calculated);
      return calculated;
    })();

    // ★ Determine the ACTUAL total trek cost (for records, not for charging)
    const actualTotalAmount =
      bookingDetails.actualTotalAmount ||
      bookingDetails.totalAmount ||
      paymentAmount;

    console.log('💰 Payment breakdown:', {
      paymentAmount_chargedNow: paymentAmount,
      actualTotalAmount_forRecords: actualTotalAmount,
      upfrontAmount: bookingDetails.upfrontAmount || bookingDetails.actualUpfrontAmount,
      remainingAmount: bookingDetails.remainingAmount || bookingDetails.actualRemainingAmount,
    });

    const orderData = {
      userId: userId,

      // Participant data
      primaryBooker: bookingDetails.primaryBooker || {},
      participants: bookingDetails.participants || [],
      totalParticipants: bookingDetails.totalParticipants || 1,

      // Coupon data
      coupon: bookingDetails.coupon
        ? {
            id: bookingDetails.coupon.id,
            code: bookingDetails.coupon.code,
            discount: bookingDetails.coupon.discount,
            discountType: bookingDetails.coupon.discountType,
          }
        : null,

      // User information
      userEmail: user
        ? user.email
        : bookingDetails.primaryBooker?.email || bookingDetails.email || 'anonymous@example.com',
      email:
        bookingDetails.primaryBooker?.email ||
        bookingDetails.email ||
        (user ? user.email : 'anonymous@example.com'),
      userName: user
        ? user.displayName || bookingDetails.primaryBooker?.name || bookingDetails.name || 'Guest User'
        : bookingDetails.primaryBooker?.name || bookingDetails.name || 'Guest User',
      name:
        bookingDetails.primaryBooker?.name ||
        bookingDetails.name ||
        (user ? user.displayName : 'Guest User'),
      contactNumber:
        bookingDetails.primaryBooker?.contactNumber || bookingDetails.contactNumber || '',
      phoneNumber:
        bookingDetails.primaryBooker?.contactNumber || bookingDetails.contactNumber || '',
      phone: bookingDetails.primaryBooker?.contactNumber || bookingDetails.contactNumber || '',

      // Trek information
      trekId: trekData?.id || 'unknown-trek',
      trekName: trekData?.name || trekData?.title || 'Unknown Trek',
      trekTitle: trekData?.title || trekData?.name || 'Unknown Trek',
      trekLocation: trekData?.location || '',
      trekDuration: trekData?.duration || '',
      trekDifficulty: trekData?.difficulty || '',
      trekImage: trekData?.image || trekData?.imageUrl || '',

      // Booking details
      startDate: bookingDetails?.startDate || new Date().toISOString().split('T')[0],
      specialRequests: bookingDetails?.specialRequests || '',

      // ★ Pricing — store REAL amounts in booking record
      pricePerPerson: bookingDetails.pricePerPerson || trekData?.numericPrice || 100,
      subtotal:
        bookingDetails.subtotal ||
        (bookingDetails.pricePerPerson || trekData?.numericPrice || 100) *
          (bookingDetails?.totalParticipants || 1),
      discount: bookingDetails.discount || 0,

      // ★ Store the ACTUAL full trek cost (not the payment amount)
      totalAmount:
        bookingDetails.actualTotalAmount || bookingDetails.totalAmount || paymentAmount,

      // ★ Store the split amounts
      upfrontAmount:
        bookingDetails.actualUpfrontAmount || bookingDetails.upfrontAmount || paymentAmount,
      remainingAmount:
        bookingDetails.actualRemainingAmount || bookingDetails.remainingAmount || 0,
      upfrontPercentage: bookingDetails.upfrontPercentage || 20,

      // ★ This is what Razorpay actually charges
      amount: paymentAmount,
      paymentAmount: paymentAmount,

      // Original amounts for reference
      originalAmount:
        bookingDetails.actualTotalAmount || bookingDetails.totalAmount || paymentAmount,

      currency: 'INR',
      bookingDate: new Date().toISOString(),
    };

    if (orderData.amount < 1) {
      console.warn('⚠️ Invalid amount, setting to minimum ₹100');
      orderData.amount = 100;
    }

    const { fixedData } = validateFirestoreData(orderData);

    console.log('💾 Creating order — Razorpay will charge:', fixedData.amount);
    console.log('💾 Total trek cost stored:', fixedData.totalAmount);
    console.log('💾 Upfront stored:', fixedData.upfrontAmount);
    console.log('💾 Remaining stored:', fixedData.remainingAmount);
    console.log('👥 Participants:', fixedData.participants);

    const order = await createRazorpayOrder(fixedData);
    console.log('📝 Order created:', order);

    // ★ Razorpay options — amount in paise
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: parseInt(order.amount), // already in paise (upfront × 100)
      currency: 'INR',
      name: 'Trovia Treks',
      description: `Booking deposit (20%) for ${orderData.trekName} - ${orderData.totalParticipants} participant(s)`,
      notes: {
        bookingId: order.bookingId,
        trekId: orderData.trekId,
        totalParticipants: orderData.totalParticipants,
        totalTrekCost: orderData.totalAmount,
        upfrontAmount: orderData.upfrontAmount,
        paymentType: '20_percent_deposit',
      },
      prefill: {
        name: orderData.userName,
        email: orderData.userEmail,
        contact: orderData.contactNumber || '',
      },
      theme: {
        color: '#f97316',
      },
    };

    console.log('🚀 Razorpay modal amount (paise):', options.amount);
    console.log('🚀 Razorpay modal amount (₹):', options.amount / 100);
    console.groupEnd();

    await initializeRazorpayPayment(options);

    return {
      orderId: order.bookingId,
      amount: order.amount,
      success: true,
    };
  } catch (error) {
    console.error('❌ Payment processing error:', error);
    console.groupEnd();
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
};

/**
 * Handle successful payment
 * @param {string} bookingId - Booking ID
 * @param {Object} paymentResponse - Razorpay payment response
 * @returns {Promise<Object>} - Updated booking
 */
export const handlePaymentSuccess = async (bookingId, paymentResponse) => {
  try {
    console.log('⭐ Payment success handler called with:', { bookingId, paymentResponse });

    if (!paymentResponse || typeof paymentResponse !== 'object') {
      console.warn('⚠️ Invalid payment response, creating empty object:', paymentResponse);
      paymentResponse = {};
    }

    console.log('📊 DEBUG - All booking ID sources:', {
      functionParam: bookingId,
      responseBookingId: paymentResponse?.bookingId,
      responseVerifiedId: paymentResponse?.verifiedBookingId,
      responseOrderId: paymentResponse?.razorpay_order_id,
      responseNotesId: paymentResponse?.notes?.bookingId,
      globalVariable: window.lastRazorpayBookingId,
      paymentId: paymentResponse?.razorpay_payment_id,
    });

    let potentialId = null;

    if (typeof bookingId === 'string' && bookingId.trim() !== '') {
      potentialId = bookingId;
      console.log('Using provided bookingId:', potentialId);
    } else if (
      typeof paymentResponse.verifiedBookingId === 'string' &&
      paymentResponse.verifiedBookingId.trim() !== ''
    ) {
      potentialId = paymentResponse.verifiedBookingId;
      console.log('Using verifiedBookingId from response:', potentialId);
    } else if (
      typeof paymentResponse.bookingId === 'string' &&
      paymentResponse.bookingId.trim() !== ''
    ) {
      potentialId = paymentResponse.bookingId;
      console.log('Using bookingId from response:', potentialId);
    } else if (
      typeof paymentResponse.razorpay_order_id === 'string' &&
      paymentResponse.razorpay_order_id.trim() !== ''
    ) {
      potentialId = paymentResponse.razorpay_order_id;
      console.log('Using razorpay_order_id as bookingId:', potentialId);
    } else if (
      paymentResponse.notes &&
      typeof paymentResponse.notes.bookingId === 'string' &&
      paymentResponse.notes.bookingId.trim() !== ''
    ) {
      potentialId = paymentResponse.notes.bookingId;
      console.log('Using bookingId from response notes:', potentialId);
    } else if (
      typeof window.lastRazorpayBookingId === 'string' &&
      window.lastRazorpayBookingId.trim() !== ''
    ) {
      potentialId = window.lastRazorpayBookingId;
      console.log('Using global variable lastRazorpayBookingId:', potentialId);
    }

    if (!potentialId && paymentResponse.razorpay_payment_id) {
      potentialId = `payment_${paymentResponse.razorpay_payment_id}`;
      console.log('Generated ID from payment ID:', potentialId);
    }

    if (!potentialId) {
      potentialId = `fallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      console.log('Using ultimate fallback ID:', potentialId);
    }

    const actualBookingId = getSafeDocumentId(potentialId);

    if (actualBookingId !== potentialId) {
      console.log('ID was sanitized for Firestore:', {
        original: potentialId,
        sanitized: actualBookingId,
      });
    }

    console.log('✅ Final booking ID for payment verification:', actualBookingId);

    const enhancedPaymentResponse = {
      ...paymentResponse,
      bookingId: actualBookingId,
      verifiedBookingId: actualBookingId,
      orderId: actualBookingId,
      notes: {
        ...(paymentResponse.notes || {}),
        bookingId: actualBookingId,
        verifiedBookingId: actualBookingId,
        timestamp: Date.now(),
      },
    };

    window.lastRazorpayBookingId = actualBookingId;

    console.log('💼 Calling verifyAndCompletePayment with:', {
      bookingId: actualBookingId,
      paymentResponse: enhancedPaymentResponse,
    });

    const updatedBooking = await verifyAndCompletePayment(actualBookingId, enhancedPaymentResponse);

    console.log('✅ Payment verification completed with result:', updatedBooking);

    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous-user';

    const paymentId =
      paymentResponse.razorpay_payment_id ||
      `test_payment_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const paymentRef = doc(db, 'payments', paymentId);
    await setDoc(paymentRef, {
      bookingId: actualBookingId,
      userId,
      paymentId: paymentId,
      orderId: paymentResponse.razorpay_order_id || actualBookingId || 'test_order',
      signature: paymentResponse.razorpay_signature || 'test_signature',
      status: 'completed',
      originalBookingId: bookingId || 'not_provided',
      responseBookingId: paymentResponse.bookingId || 'not_in_response',
      responseOrderId: paymentResponse.razorpay_order_id || 'not_in_response',
      globalBookingId: window.lastRazorpayBookingId || 'not_stored',
      amount: paymentResponse.amount || updatedBooking.amount || 0,
      currency: paymentResponse.currency || 'INR',
      timestamp: serverTimestamp(),
      paymentJson: JSON.stringify(paymentResponse),
    });

    // Handle coupon usage increment
    try {
      if (updatedBooking.coupon && updatedBooking.coupon.id) {
        console.log('🏷️ Updating coupon usage count for:', updatedBooking.coupon.code);
        const couponRef = doc(db, 'coupons', updatedBooking.coupon.id);
        await updateDoc(couponRef, {
          usageCount: increment(1),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Coupon usage count updated successfully');
      }
    } catch (couponError) {
      console.error('Error updating coupon usage count:', couponError);
    }

    return updatedBooking;
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw new Error('Failed to complete payment');
  }
};

/**
 * Handle failed payment
 * @param {string} bookingId - Booking ID
 * @param {Object} error - Error details
 * @returns {Promise<void>}
 */
export const handlePaymentFailure = async (bookingId, error) => {
  await savePaymentFailureDetails(bookingId, {
    code: error.code || 'unknown',
    description: error.description || error.message || 'Unknown error',
    source: error.source || 'client',
    step: error.step || 'payment',
    timestamp: new Date().toISOString(),
  });
};