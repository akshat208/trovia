import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiX, FiCalendar, FiUser, FiPhone, FiMessageSquare, FiCreditCard, FiCheck, FiAlertCircle, FiInfo, FiArrowLeft, FiChevronLeft, FiChevronRight, FiShield, FiLock } from 'react-icons/fi';
import { processBookingPayment, completeBookingPayment, handleBookingPaymentFailure } from '../utils/bookingService';
import { loadRazorpayScript } from '../services/payment/razorpay';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import CouponSection from './CouponSection';
import emailService from '../services/emailService';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ============================================
// ANIMATIONS
// ============================================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;
const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;
const imageFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(-1deg); }
`;
const mobileImageWave = keyframes`
  0%, 100% { transform: translateX(-8px) translateY(0px) rotate(-2deg); }
  25% { transform: translateX(-2px) translateY(-3px) rotate(-1deg); }
  50% { transform: translateX(8px) translateY(-1px) rotate(2deg); }
  75% { transform: translateX(2px) translateY(-4px) rotate(1deg); }
`;
const imageEntrance = keyframes`
  0% { opacity: 0; transform: translateY(40px) rotate(-8deg) scale(0.85); filter: blur(6px); }
  60% { opacity: 0.9; filter: blur(1px); }
  100% { opacity: 1; transform: translateY(0px) rotate(-3deg) scale(1); filter: blur(0px); }
`;
const mobileImageEntrance = keyframes`
  0% { opacity: 0; transform: translateY(20px) scale(0.9); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0px) scale(1); filter: blur(0px); }
`;
const panelSlideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
const bounceIn = keyframes`
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
`;
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;
const successPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
`;
const confetti = keyframes`
  0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
`;
const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;
const slideInUp = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================
// THEME
// ============================================
const theme = {
  primary: '#FF6B35',
  primaryDark: '#E85D2F',
  primaryLight: '#FFB399',
  primaryGlow: 'rgba(255, 107, 53, 0.25)',
  secondary: '#1a1d23',
  secondaryLight: '#24272e',
  accent: '#FF9A6C',
  success: '#4eab53',
  white: '#FFFFFF',
  cream: '#FFF8F0',
  peach: '#FFE9DC',
  lightGray: '#F5F5F5',
  mediumGray: '#3a3d44',
  darkGray: '#8a8f9a',
  text: '#ffffff',
  textLight: '#9ca0ab',
  textDark: '#e8e9ec',
  cardBg: '#22252c',
  cardBgLight: '#2a2d35',
  inputBg: '#2a2d35',
  inputBorder: '#3a3d44',
  borderLight: '#333640',
};

// ============================================
// CALENDAR
// ============================================
const CalendarWrapper = styled.div`
  .react-datepicker {
    font-family: 'Sora', 'Inter', sans-serif;
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    width: 100%;
    background: ${theme.cardBg};
  }
  .react-datepicker__month-container { width: 100%; float: none; }
  .react-datepicker__header { background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%); border-bottom: none; padding: 1rem 1rem 0.75rem; }
  .react-datepicker__current-month { color: white; font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
  .react-datepicker__navigation { top: 1rem; }
  .react-datepicker__navigation-icon::before { border-color: white; }
  .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: rgba(255,255,255,0.7); }
  .react-datepicker__day-names { background: rgba(255,255,255,0.15); margin: 0; padding: 0.25rem 0; display: flex; justify-content: space-around; }
  .react-datepicker__day-name { color: rgba(255,255,255,0.9); font-size: 0.75rem; font-weight: 600; width: 2.2rem; line-height: 1.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .react-datepicker__month { margin: 0; padding: 0.75rem; background: ${theme.cardBg}; }
  .react-datepicker__week { display: flex; justify-content: space-around; margin-bottom: 0.25rem; }
  .react-datepicker__day { width: 2.2rem; height: 2.2rem; line-height: 2.2rem; border-radius: 50%; font-size: 0.875rem; font-weight: 500; color: ${theme.textDark}; transition: all 0.2s ease; position: relative; margin: 0.1rem; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; &:hover { background: rgba(255, 107, 53, 0.2); border-radius: 50%; color: ${theme.primary}; } }
  .react-datepicker__day--selected { background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%) !important; color: white !important; border-radius: 50% !important; font-weight: 700 !important; box-shadow: 0 4px 12px ${theme.primaryGlow} !important; &:hover { background: ${theme.primaryDark} !important; } }
  .react-datepicker__day--today { font-weight: 700; border: 2px solid ${theme.primary}; border-radius: 50%; color: ${theme.primary}; }
  .react-datepicker__day--disabled { color: #555 !important; cursor: not-allowed !important; &:hover { background: transparent !important; color: #555 !important; } }
  .react-datepicker__day--keyboard-selected { background: rgba(255, 107, 53, 0.15); border-radius: 50%; color: ${theme.primary}; }
  @media (max-width: 480px) { .react-datepicker__day-name, .react-datepicker__day { width: 2rem; height: 2rem; line-height: 2rem; font-size: 0.8rem; } }
`;

const DayWithDot = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; gap: 1px;`;
const DayNumber = styled.span`line-height: 1; font-size: 0.875rem;`;
const DayDot = styled.span`width: 5px; height: 5px; border-radius: 50%; background: ${props => props.available ? '#4CAF50' : '#EF5350'}; display: block; flex-shrink: 0;`;

// ============================================
// PAGE LAYOUT
// ============================================
const PageWrapper = styled.div`
  min-height: 100dvh;
  background: #0f1114;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  margin-bottom: calc(-90px - env(safe-area-inset-bottom));
  @media (max-width: 768px) { margin-bottom: calc(-75px - env(safe-area-inset-bottom)); }
  @media (max-width: 480px) { padding: 0; align-items: flex-start; height: 100dvh; overflow: hidden; margin-bottom: calc(-70px - env(safe-area-inset-bottom)); }
  @media (max-height: 600px) { margin-bottom: calc(-65px - env(safe-area-inset-bottom)); }
`;

const BookingCard = styled.div`
  width: 100%;
  max-width: 1080px;
  height: 88vh;
  max-height: 820px;
  display: grid;
  grid-template-columns: 420px 1fr;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  animation: ${scaleIn} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  @media (max-width: 900px) { display: flex; flex-direction: column; height: 100dvh; min-height: 100dvh; max-height: 100dvh; max-width: 100%; border-radius: 0; box-shadow: none; animation: none; }
`;

const OrangePanel = styled.div`
  background: linear-gradient(165deg, #FF8C42 0%, #FF6B35 35%, #E85D2F 70%, #D4502A 100%);
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 2rem 2.5rem;
  z-index: 1;
  min-height: 100%;
  &::before { content: ''; position: absolute; top: -20%; right: -30%; width: 140%; height: 70%; background: rgba(255, 255, 255, 0.06); border-radius: 0 0 50% 50%; transform: rotate(-8deg); pointer-events: none; }
  &::after { content: ''; position: absolute; bottom: -5%; left: -20%; width: 140%; height: 40%; background: rgba(0, 0, 0, 0.08); border-radius: 50% 50% 0 0; pointer-events: none; }
  @media (max-width: 900px) { min-height: 250px; height: 250px; flex-shrink: 0; padding: 1rem 1rem 2.2rem; justify-content: space-between; overflow: hidden; &::before { top: -35%; right: -35%; width: 150%; height: 90%; transform: rotate(-6deg); } &::after { display: none; } }
  @media (max-width: 480px) { min-height: 225px; height: 225px; padding: 0.9rem 0.9rem 2rem; }
`;

const FloatingCircle = styled.div`
  position: absolute; border-radius: 50%; background: rgba(255, 255, 255, ${props => props.opacity || '0.08'}); width: ${props => props.size || '120px'}; height: ${props => props.size || '120px'}; top: ${props => props.top || 'auto'}; left: ${props => props.left || 'auto'}; right: ${props => props.right || 'auto'}; bottom: ${props => props.bottom || 'auto'}; pointer-events: none;
  @media (max-width: 900px) { width: ${props => `calc(${props.size || '120px'} * 0.5)`}; height: ${props => `calc(${props.size || '120px'} * 0.5)`}; }
`;

const CurvedDivider = styled.div`
  position: absolute; right: -10px; top: 0; height: 100%; width: 90px; z-index: 15; pointer-events: none;
  svg { height: 100%; width: 100%; display: block; }
  .desktop-curve { display: block; }
  .mobile-curve { display: none; }
  @media (max-width: 900px) { right: 0; top: auto; bottom: -1px; left: 0; width: 100%; height: 40px; .desktop-curve { display: none; } .mobile-curve { display: block; width: 100%; height: 100%; } }
  @media (max-width: 480px) { height: 34px; }
`;

const FloatingImageContainer = styled.div`
  position: relative; display: flex; justify-content: center; align-items: center; flex: 1; z-index: 10; padding: 1rem; min-height: 0; overflow: visible; animation: ${imageEntrance} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
  @media (max-width: 900px) { flex: 1; padding: 0.25rem 0 0; animation: ${mobileImageEntrance} 0.6s ease-out 0.2s both; }
`;

const TrekImageCard = styled.div`
  width: 390px; height: 360px; border-radius: 24px; overflow: hidden; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15); position: relative; flex-shrink: 0; animation: ${imageFloat} 3s ease-in-out infinite;
  img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
  &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.5) 100%); pointer-events: none; }
  @media (max-width: 900px) { width: 118px; height: 118px; border-radius: 18px; animation: ${mobileImageWave} 3.2s ease-in-out infinite; transform-origin: center center; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255,255,255,0.12); &::after { background: linear-gradient(to bottom, transparent 58%, rgba(0, 0, 0, 0.28) 100%); } }
  @media (max-width: 480px) { width: 100px; height: 100px; border-radius: 16px; }
`;

const ImageBadge = styled.div`
  position: absolute; bottom: 1.25rem; left: 1.25rem; right: 1.25rem; z-index: 2; color: white;
  h3 { margin: 0 0 0.2rem; font-size: 1.05rem; font-weight: 700; font-family: 'Sora', sans-serif; text-shadow: 0 2px 12px rgba(0,0,0,0.6); line-height: 1.25; }
  p { margin: 0; font-size: 0.78rem; opacity: 0.9; display: flex; align-items: center; gap: 0.3rem; }
  @media (max-width: 900px) { display: none; }
`;

const OrangePanelInfo = styled.div`position: relative; z-index: 5; flex-shrink: 0; @media (max-width: 900px) { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }`;
const PanelTrekName = styled.h2`font-family: 'Sora', sans-serif; font-size: 1.3rem; font-weight: 700; color: white; margin: 0 0 0.35rem; line-height: 1.3; text-shadow: 0 2px 8px rgba(0,0,0,0.15); @media (max-width: 900px) { font-size: 0.98rem; margin: 0 0 0.15rem; max-width: 90%; } @media (max-width: 480px) { font-size: 0.88rem; }`;
const PanelLocation = styled.p`font-size: 0.85rem; color: rgba(255,255,255,0.85); margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.3rem; @media (max-width: 900px) { font-size: 0.72rem; margin: 0 0 0.45rem; justify-content: center; } @media (max-width: 480px) { font-size: 0.68rem; }`;
const PriceTag = styled.div`
  display: inline-flex; align-items: baseline; gap: 0.25rem; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(10px); padding: 0.6rem 1.15rem; border-radius: 50px; border: 1px solid rgba(255,255,255,0.15);
  .currency { font-size: 0.85rem; color: rgba(255,255,255,0.85); font-weight: 600; }
  .amount { font-size: 1.5rem; font-weight: 800; color: white; font-family: 'Sora', sans-serif; }
  .suffix { font-size: 0.75rem; color: rgba(255,255,255,0.7); }
  @media (max-width: 900px) { padding: 0.28rem 0.7rem; .amount { font-size: 1rem; } .currency { font-size: 0.7rem; } .suffix { font-size: 0.62rem; } }
  @media (max-width: 480px) { padding: 0.25rem 0.6rem; .amount { font-size: 0.92rem; } }
`;

const DarkFormPanel = styled.div`
  background: ${theme.secondary}; display: flex; flex-direction: column; overflow-y: auto; max-height: 100%; position: relative; min-height: 0;
  &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-track { background: transparent; } &::-webkit-scrollbar-thumb { background: ${theme.mediumGray}; border-radius: 4px; }
  @media (max-width: 900px) { flex: 1; min-height: 0; max-height: none; overflow-y: auto; -webkit-overflow-scrolling: touch; border-top-left-radius: 20px; border-top-right-radius: 20px; margin-top: -1px; }
`;

const PanelHeader = styled.div`
  padding: 1.75rem 2rem 0; position: sticky; top: 0; background: ${theme.secondary}; z-index: 10; border-bottom: 1px solid ${theme.borderLight}; padding-bottom: 1rem;
  @media (max-width: 900px) { padding: 1.25rem 1.25rem 0; padding-bottom: 0.75rem; }
  @media (max-width: 480px) { padding: 1rem 1rem 0; padding-bottom: 0.65rem; }
`;

const HeaderTop = styled.div`display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; @media (max-width: 900px) { margin-bottom: 1rem; gap: 0.6rem; }`;
const BackBtn = styled.button`width: 36px; height: 36px; border-radius: 50%; background: ${theme.cardBg}; border: 1px solid ${theme.borderLight}; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${theme.textDark}; font-size: 1rem; transition: all 0.2s; flex-shrink: 0; &:hover { background: ${theme.primary}; border-color: ${theme.primary}; color: white; transform: scale(1.08); } @media (max-width: 480px) { width: 32px; height: 32px; font-size: 0.9rem; }`;
const HeaderTitle = styled.h1`font-family: 'Sora', sans-serif; font-size: 1.2rem; font-weight: 700; color: ${theme.textDark}; margin: 0; span { color: ${theme.primary}; } @media (max-width: 480px) { font-size: 1.05rem; }`;

const StepTrack = styled.div`
  display: flex; align-items: center; gap: 0;
  @media (max-width: 480px) { justify-content: center; transform: scale(0.85); transform-origin: center center; margin: -4px 0 -8px 0; }
  @media (max-width: 360px) { transform: scale(0.75); margin: -6px 0 -10px 0; }
`;
const StepItem = styled.div`display: flex; flex-direction: column; align-items: center; gap: 0.3rem; position: relative;`;
const StepDot = styled.div`
  width: ${props => props.active ? '14px' : '10px'}; height: ${props => props.active ? '14px' : '10px'}; border-radius: 50%;
  background: ${props => props.completed ? theme.success : props.active ? theme.primary : theme.mediumGray};
  border: ${props => props.active ? `3px solid rgba(255, 107, 53, 0.3)` : '2px solid transparent'};
  transition: all 0.3s ease; box-shadow: ${props => props.active ? `0 0 0 3px ${theme.primaryGlow}` : 'none'};
  @media (max-width: 480px) { transform: translateY(-6px); }
`;
const StepLine = styled.div`
  width: 60px; height: 2px;
  background: ${props => props.completed ? `linear-gradient(90deg, ${theme.success}, ${theme.success})` : theme.mediumGray};
  transition: all 0.4s ease; margin: 0 0.3rem;
  @media (max-width: 900px) { width: 50px; }
  @media (max-width: 480px) { width: 35px; transform: translateY(-6px); }
  @media (max-width: 360px) { width: 25px; }
`;
const StepLabel = styled.span`
  font-size: 0.68rem; font-weight: ${props => props.active ? '700' : '500'};
  color: ${props => props.active ? theme.primary : props.completed ? theme.success : theme.textLight};
  white-space: nowrap; position: absolute; top: 22px; font-family: 'Sora', sans-serif;
  @media (max-width: 480px) { font-size: 0.6rem; }
`;

const PanelBody = styled.div`
  padding: 1.5rem 2rem; flex: 1; display: flex; flex-direction: column; gap: 1.25rem; animation: ${panelSlideIn} 0.4s ease-out;
  @media (max-width: 900px) { padding: 1.25rem; }
  @media (max-width: 480px) { padding: 1rem; gap: 1rem; }
`;

const PanelFooter = styled.div`
  padding: 1rem 2rem 1em; background: ${theme.secondary}; border-top: 1px solid ${theme.borderLight}; display: flex; justify-content: space-between; align-items: center; gap: 1rem; position: sticky; bottom: 0; z-index: 10;
  @media (max-width: 900px) { padding: 1rem 1.25rem 1.25rem; }
  @media (max-width: 480px) { padding: 0.85rem 1rem 1rem; flex-direction: column-reverse; gap: 0.75rem; }
`;

// ============================================
// FORM COMPONENTS
// ============================================
const Form = styled.form`display: flex; flex-direction: column; gap: 1.25rem; @media (max-width: 480px) { gap: 1rem; }`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 0.5rem; position: relative;`;
const Label = styled.label`font-weight: 600; font-size: 0.82rem; color: ${theme.textLight}; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Sora', sans-serif; svg { color: ${theme.primary}; font-size: 0.9rem; } @media (max-width: 480px) { font-size: 0.75rem; }`;
const Input = styled.input`
  padding: 0.8rem 1rem; border: 1.5px solid ${theme.inputBorder}; border-radius: 10px; font-size: 0.9rem; font-weight: 500; transition: all 0.25s ease; outline: none; background: ${theme.inputBg}; color: ${theme.textDark}; font-family: 'Sora', 'Inter', sans-serif;
  &::placeholder { color: #5a5e6a; font-weight: 400; }
  &:focus { border-color: ${theme.primary}; box-shadow: 0 0 0 3px ${theme.primaryGlow}; }
  &:hover:not(:focus):not(:disabled) { border-color: rgba(255, 107, 53, 0.4); }
  &:disabled { background: ${theme.cardBg}; color: ${theme.darkGray}; opacity: 0.6; }
  @media (max-width: 480px) { padding: 0.7rem 0.85rem; font-size: 0.85rem; border-radius: 8px; }
`;
const Textarea = styled(Input).attrs({ as: 'textarea' })`resize: vertical; min-height: 80px; @media (max-width: 480px) { min-height: 60px; }`;
const TwoCardRow = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; @media (max-width: 600px) { grid-template-columns: 1fr; gap: 0.75rem; }`;
const InteractiveCard = styled.div`
  background: ${props => props.isOpen ? theme.cardBgLight : theme.cardBg}; padding: 1rem 1.1rem; border-radius: 14px;
  border: 2px solid ${props => props.isOpen ? theme.primary : theme.borderLight}; cursor: pointer; transition: all 0.25s ease;
  box-shadow: ${props => props.isOpen ? `0 4px 20px ${theme.primaryGlow}` : `0 1px 4px rgba(0,0,0,0.2)`};
  &:hover { border-color: ${theme.primary}; box-shadow: 0 4px 16px ${theme.primaryGlow}; }
  @media (max-width: 480px) { padding: 0.85rem 1rem; border-radius: 12px; }
`;
const CardHeader = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const CardLabel = styled.div`display: flex; align-items: center; gap: 0.45rem; font-size: 0.72rem; font-weight: 700; color: ${theme.textLight}; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Sora', sans-serif; svg { color: ${theme.primary}; font-size: 0.85rem; }`;
const CardValue = styled.div`font-size: 0.95rem; font-weight: 700; color: ${theme.textDark}; margin-top: 0.35rem; display: flex; align-items: center; justify-content: space-between; font-family: 'Sora', sans-serif; @media (max-width: 480px) { font-size: 0.88rem; }`;
const CardArrow = styled.div`color: ${theme.primary}; font-size: 1rem; transition: transform 0.3s ease; transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};`;
const CardDropdown = styled.div`max-height: ${props => props.isOpen ? '500px' : '0'}; opacity: ${props => props.isOpen ? '1' : '0'}; overflow: hidden; transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); margin-top: ${props => props.isOpen ? '0.75rem' : '0'}; padding-top: ${props => props.isOpen ? '0.75rem' : '0'}; border-top: ${props => props.isOpen ? `1px solid ${theme.borderLight}` : 'none'};`;
const SelectedBadge = styled.span`background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark}); color: white; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;`;

const ParticipantCounterWrapper = styled.div`display: flex; align-items: center; justify-content: center; gap: 0; background: ${theme.inputBg}; border: 1.5px solid ${theme.inputBorder}; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.2);`;
const CounterButton = styled.button`
  width: 44px; height: 48px; display: flex; align-items: center; justify-content: center;
  background: ${props => props.disabled ? theme.cardBg : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`};
  border: none; cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'}; transition: all 0.2s ease;
  font-size: 1.4rem; font-weight: 500; color: ${props => props.disabled ? theme.darkGray : 'white'}; flex-shrink: 0; line-height: 1; border-radius: 50%; margin: 0 8px;
  &:hover:not(:disabled) { background: linear-gradient(135deg, ${theme.primaryDark} 0%, #cc4a20 100%); transform: scale(1.05); }
  @media (max-width: 480px) { width: 40px; height: 44px; font-size: 1.2rem; }
`;
const CounterDisplay = styled.div`flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.4rem 0.75rem;`;
const CounterNumber = styled.span`font-size: 1.6rem; font-weight: 800; color: ${theme.textDark}; line-height: 1; font-family: 'Sora', sans-serif;`;
const CounterLabel = styled.span`font-size: 0.7rem; color: ${theme.darkGray}; font-weight: 500; margin-top: 2px;`;
const CounterInfoRow = styled.div`display: flex; align-items: center; justify-content: space-between; margin-top: 0.6rem; padding: 0.4rem 0.65rem; background: ${theme.cardBg}; border-radius: 8px; font-size: 0.75rem; color: ${theme.darkGray}; font-weight: 500; span { color: ${theme.primary}; font-weight: 700; }`;

const DetailBox = styled.div`
  background: ${props => props.isExpanded ? theme.cardBgLight : theme.cardBg}; padding: ${props => props.isExpanded ? '1.25rem' : '1rem'}; border-radius: 14px;
  border: 2px solid ${props => props.isExpanded ? theme.primary : theme.borderLight}; cursor: ${props => props.isExpanded ? 'default' : 'pointer'};
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); position: relative;
  box-shadow: ${props => props.isExpanded ? `0 8px 24px ${theme.primaryGlow}` : `0 1px 4px rgba(0,0,0,0.2)`};
  ${props => props.isExpanded && css`&::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, ${theme.primary}, ${theme.accent}); border-radius: 14px 14px 0 0; }`}
  &:hover:not([data-expanded="true"]) { border-color: rgba(255, 107, 53, 0.4); transform: translateY(-1px); box-shadow: 0 4px 16px ${theme.primaryGlow}; }
  ${props => props.isDisabled && css`opacity: 0.35; pointer-events: none;`}
  @media (max-width: 480px) { padding: ${props => props.isExpanded ? '1rem' : '0.85rem'}; border-radius: 12px; }
`;
const DetailBoxHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: ${props => props.isExpanded ? '1rem' : '0'};`;
const DetailBoxTitle = styled.h3`margin: 0; font-size: 0.9rem; font-weight: 700; color: ${theme.textDark}; display: flex; align-items: center; gap: 0.5rem; font-family: 'Sora', sans-serif; svg { color: ${theme.primary}; } @media (max-width: 480px) { font-size: 0.82rem; gap: 0.4rem; }`;
const StatusDot = styled.span`width: 7px; height: 7px; border-radius: 50%; background: ${props => props.completed ? theme.success : theme.mediumGray}; margin-left: 0.4rem;`;
const DetailBoxContent = styled.div`max-height: ${props => props.isExpanded ? '800px' : '0'}; opacity: ${props => props.isExpanded ? '1' : '0'}; overflow: hidden; transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);`;
const FieldRow = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.65rem; @media (max-width: 600px) { grid-template-columns: 1fr; gap: 0.6rem; }`;
const DoneButton = styled.button`
  background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%); color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.25s ease; margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 12px ${theme.primaryGlow}; font-family: 'Sora', sans-serif;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px ${theme.primaryGlow}; }
  &:disabled { background: ${theme.mediumGray}; box-shadow: none; cursor: not-allowed; }
  @media (max-width: 480px) { padding: 0.55rem 1rem; font-size: 0.8rem; width: 100%; justify-content: center; }
`;
const ErrorSpan = styled.span`
  color: #EF5350; font-size: 0.75rem; font-weight: 500; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.3rem;
  &::before { content: '!'; background: #EF5350; color: white; width: 13px; height: 13px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; flex-shrink: 0; }
`;

// ============================================
// STEP 2 — PAYMENT COMPONENTS
// ============================================
const SecurePaymentBanner = styled.div`display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem; background: rgba(78, 171, 83, 0.1); border: 1px solid rgba(78, 171, 83, 0.25); border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #6BCB77; svg { font-size: 0.9rem; } @media (max-width: 480px) { font-size: 0.72rem; padding: 0.5rem; }`;

const BookingSummaryCard = styled.div`background: ${theme.cardBg}; padding: 1.25rem; border-radius: 16px; border: 1px solid ${theme.borderLight}; @media (max-width: 480px) { padding: 1rem; border-radius: 12px; }`;
const SummaryHeader = styled.div`display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.85rem; padding-bottom: 0.65rem; border-bottom: 1px solid ${theme.borderLight};`;
const SectionIcon = styled.div`width: 36px; height: 36px; border-radius: 10px; background: ${props => props.variant === 'green' ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`}; display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem; flex-shrink: 0; @media (max-width: 480px) { width: 32px; height: 32px; font-size: 0.9rem; }`;
const SummaryTitle = styled.h3`margin: 0; font-size: 1rem; font-weight: 700; color: ${theme.textDark}; font-family: 'Sora', sans-serif; @media (max-width: 480px) { font-size: 0.9rem; }`;
const SummaryGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; @media (max-width: 480px) { grid-template-columns: 1fr; gap: 0.5rem; }`;
const SummaryItem = styled.div`font-size: 0.85rem; color: ${theme.textLight}; font-weight: 500; strong { color: ${theme.textDark}; font-weight: 600; } @media (max-width: 480px) { font-size: 0.8rem; }`;
const ParticipantChip = styled.div`display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; background: ${props => props.isPrimary ? `rgba(255, 107, 53, 0.15)` : theme.cardBgLight}; border-radius: 20px; font-size: 0.78rem; font-weight: 600; color: ${props => props.isPrimary ? theme.primary : theme.textLight}; border: 1px solid ${props => props.isPrimary ? 'rgba(255,107,53,0.25)' : theme.borderLight}; margin: 0.2rem 0.2rem 0.2rem 0; @media (max-width: 480px) { font-size: 0.72rem; padding: 0.25rem 0.5rem; }`;

// ★ Payment Split Card
const PaymentSplitCard = styled.div`
  background: rgba(255, 107, 53, 0.06);
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 14px;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark}); }
  @media (max-width: 480px) { padding: 1rem; border-radius: 12px; }
`;
const SplitGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.85rem; @media (max-width: 400px) { grid-template-columns: 1fr; }`;
const SplitItem = styled.div`
  background: ${props => props.$active ? 'rgba(255, 107, 53, 0.12)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${props => props.$active ? 'rgba(255, 107, 53, 0.25)' : theme.borderLight};
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
`;
const SplitPercent = styled.div`font-size: 1.6rem; font-weight: 800; color: ${props => props.$active ? theme.primary : theme.textLight}; line-height: 1; margin-bottom: 0.25rem; font-family: 'Sora', sans-serif; @media (max-width: 480px) { font-size: 1.3rem; }`;
const SplitLabel = styled.div`font-size: 0.72rem; color: ${theme.darkGray}; font-weight: 500; line-height: 1.4; margin-bottom: 0.4rem;`;
const SplitAmount = styled.div`font-size: 1rem; font-weight: 700; color: ${props => props.$active ? theme.primary : theme.textDark}; font-family: 'Sora', sans-serif;`;
const SplitNote = styled.div`margin-top: 0.85rem; padding: 0.6rem 0.85rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.72rem; color: ${theme.darkGray}; display: flex; align-items: flex-start; gap: 0.4rem; line-height: 1.5; svg { color: ${theme.primary}; flex-shrink: 0; margin-top: 1px; } @media (max-width: 480px) { font-size: 0.68rem; }`;

const PriceSummary = styled.div`
  background: ${theme.cardBg}; padding: 1.4rem; border-radius: 16px; border: 1px solid ${theme.borderLight}; position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.primary}); background-size: 200% 100%; animation: ${shimmer} 2s infinite linear; }
  @media (max-width: 480px) { padding: 1.1rem; border-radius: 12px; }
`;
const PriceItem = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; font-size: 0.9rem; font-weight: 500; color: ${theme.textLight}; &:not(:last-child) { border-bottom: 1px solid ${theme.borderLight}; } @media (max-width: 480px) { font-size: 0.82rem; padding: 0.5rem 0; }`;
const PriceTotal = styled(PriceItem)`
  margin-top: 0.5rem; padding-top: 1rem; border-top: 2px solid ${theme.borderLight}; font-weight: 800; font-size: 1.25rem; color: ${theme.textDark};
  background: rgba(255, 107, 53, 0.08); margin: 0.5rem -1.4rem -1.4rem; padding: 1rem 1.4rem; border-radius: 0 0 14px 14px;
  span:last-child { color: ${theme.primary}; font-size: 1.5rem; }
  @media (max-width: 480px) { font-size: 1.1rem; margin: 0.5rem -1.1rem -1.1rem; padding: 0.85rem 1.1rem; border-radius: 0 0 10px 10px; span:last-child { font-size: 1.3rem; } }
`;

const ErrorMessage = styled.div`color: #EF5350; background: rgba(239, 83, 80, 0.1); border: 1.5px solid rgba(239, 83, 80, 0.25); padding: 1rem 1.1rem; border-radius: 12px; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 0.75rem; animation: ${bounceIn} 0.5s ease-out; svg { color: #EF5350; font-size: 1.1rem; flex-shrink: 0; } @media (max-width: 480px) { padding: 0.85rem; font-size: 0.82rem; }`;
const SuccessMessage = styled.div`color: #6BCB77; background: rgba(107, 203, 119, 0.1); border: 1.5px solid rgba(107, 203, 119, 0.25); padding: 1rem 1.1rem; border-radius: 12px; font-size: 0.9rem; font-weight: 500; display: flex; align-items: flex-start; gap: 0.75rem; animation: ${bounceIn} 0.5s ease-out; svg { color: #6BCB77; font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; } @media (max-width: 480px) { padding: 0.85rem; font-size: 0.82rem; }`;

// ============================================
// FOOTER BUTTONS
// ============================================
const Button = styled.button`
  padding: 0.85rem 1.75rem; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 0.6rem; font-family: 'Sora', sans-serif; position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transition: left 0.4s ease; }
  &:hover::before { left: 100%; }
  @media (max-width: 480px) { width: 100%; padding: 0.8rem 1.5rem; font-size: 0.85rem; }
`;
const CancelButton = styled(Button)`background: ${theme.cardBg}; border: 1.5px solid ${theme.borderLight}; color: ${theme.textLight}; min-width: 100px; padding: 0.85rem 1.25rem; &:hover { background: ${theme.cardBgLight}; color: ${theme.textDark}; border-color: ${theme.mediumGray}; } @media (max-width: 480px) { min-width: auto; }`;
const ProceedButton = styled(Button)`background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%); border: none; color: white; min-width: 160px; box-shadow: 0 4px 15px ${theme.primaryGlow}; &:hover { transform: translateY(-2px); box-shadow: 0 8px 25px ${theme.primaryGlow}; } &:disabled { background: ${theme.mediumGray}; box-shadow: none; } @media (max-width: 480px) { min-width: auto; }`;
const PaymentButton = styled(ProceedButton)`background: linear-gradient(135deg, #2a2d35 0%, #1a1d23 100%); border: 1.5px solid ${theme.primary}; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2); &:hover { background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%); box-shadow: 0 8px 25px ${theme.primaryGlow}; }`;
const LoadingIndicator = styled.div`display: inline-block; width: 1.1rem; height: 1.1rem; border: 2.5px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #ffffff; animation: ${spin} 1s linear infinite;`;

// ============================================
// OVERLAYS
// ============================================
const ProcessingOverlay = styled.div`position: fixed; inset: 0; background: linear-gradient(135deg, rgba(15, 17, 20, 0.97) 0%, rgba(255, 107, 53, 0.1) 50%, rgba(15, 17, 20, 0.97) 100%); background-size: 400% 400%; animation: ${gradientShift} 3s ease infinite; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2000; color: white; padding: 1rem;`;
const ProcessingContent = styled.div`text-align: center; animation: ${slideInUp} 0.8s ease-out; max-width: 400px; width: 100%;`;
const ProcessingSpinner = styled.div`width: 70px; height: 70px; border: 5px solid rgba(255, 107, 53, 0.15); border-radius: 50%; border-top: 5px solid ${theme.primary}; animation: ${spin} 1s linear infinite; margin: 0 auto 2rem; @media (max-width: 480px) { width: 56px; height: 56px; border-width: 4px; margin: 0 auto 1.5rem; }`;
const ProcessingTitle = styled.h2`font-size: 1.8rem; font-weight: 700; margin: 0 0 1rem; font-family: 'Sora', sans-serif; animation: ${pulse} 2s ease-in-out infinite; color: ${theme.textDark}; @media (max-width: 480px) { font-size: 1.3rem; }`;
const ProcessingSubtitle = styled.p`font-size: 1rem; opacity: 0.6; margin: 0; color: ${theme.textLight}; @media (max-width: 480px) { font-size: 0.85rem; }`;
const EnhancedSuccessMessage = styled.div`background: linear-gradient(135deg, #4caf50 0%, #81c784 100%); color: white; padding: 2rem; border-radius: 20px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3); animation: ${successPulse} 2s ease-in-out infinite; @media (max-width: 480px) { padding: 1.5rem 1.25rem; border-radius: 16px; }`;
const SuccessIcon = styled.div`width: 72px; height: 72px; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; background: rgba(255,255,255,0.2); animation: ${bounceIn} 1s ease-out; @media (max-width: 480px) { width: 56px; height: 56px; margin: 0 auto 1rem; }`;
const SuccessTitle = styled.h3`font-size: 1.6rem; font-weight: 700; margin: 0 0 0.5rem; font-family: 'Sora', sans-serif; @media (max-width: 480px) { font-size: 1.2rem; }`;
const SuccessSubtitle = styled.p`font-size: 1rem; opacity: 0.9; margin: 0; @media (max-width: 480px) { font-size: 0.85rem; }`;
const ConfettiContainer = styled.div`position: absolute; inset: 0; pointer-events: none; overflow: hidden;`;
const ConfettiParticle = styled.div`position: absolute; width: 7px; height: 7px; background: ${props => props.color || '#ffeb3b'}; border-radius: 50%; animation: ${confetti} 3s linear infinite; animation-delay: ${props => props.delay || '0s'}; top: ${props => props.top || '50%'}; left: ${props => props.left || '50%'}`;
const CouponSuccessDiv = styled.div`margin-top: 1rem; padding: 0.85rem; background: rgba(255,255,255,0.2); border-radius: 10px;`;

// Unavailable date popup
const UnavailableDateOverlay = styled.div`position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; animation: ${fadeIn} 0.3s ease-out;`;
const UnavailableDatePopup = styled.div`background: ${theme.cardBg}; border-radius: 20px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.5); border: 1px solid ${theme.borderLight}; animation: ${bounceIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); @media (max-width: 480px) { border-radius: 16px; max-height: 85vh; }`;
const PopupHeader = styled.div`
  background: linear-gradient(135deg, #E53935 0%, #C62828 100%); padding: 1.5rem; text-align: center; position: relative;
  &::after { content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 12px solid #C62828; }
  @media (max-width: 480px) { padding: 1.25rem; }
`;
const PopupIconContainer = styled.div`width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem; animation: ${pulse} 2s ease-in-out infinite; svg { font-size: 1.6rem; color: white; } @media (max-width: 480px) { width: 48px; height: 48px; svg { font-size: 1.3rem; } }`;
const PopupTitle = styled.h3`margin: 0; color: white; font-size: 1.2rem; font-weight: 700; font-family: 'Sora', sans-serif; @media (max-width: 480px) { font-size: 1.05rem; }`;
const PopupBody = styled.div`padding: 1.85rem 1.5rem 1.25rem; overflow-y: auto; @media (max-width: 480px) { padding: 1.5rem 1rem 1rem; }`;
const PopupDateDisplay = styled.div`
  background: rgba(255, 107, 53, 0.1); border: 2px solid ${theme.primary}; border-radius: 12px; padding: 0.85rem; text-align: center; margin-bottom: 1.25rem;
  .date-label { font-size: 0.75rem; color: ${theme.primary}; font-weight: 600; text-transform: uppercase; margin-bottom: 0.2rem; }
  .date-value { font-size: 1rem; color: ${theme.textDark}; font-weight: 700; }
  @media (max-width: 480px) { padding: 0.7rem; .date-value { font-size: 0.9rem; } }
`;
const PopupMessage = styled.p`color: ${theme.textLight}; font-size: 0.95rem; line-height: 1.6; margin: 0 0 1.25rem; text-align: center; strong { color: ${theme.textDark}; } @media (max-width: 480px) { font-size: 0.85rem; }`;
const AvailableDatesSection = styled.div`margin-top: 0.85rem;`;
const AvailableDatesTitle = styled.div`display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: ${theme.primary}; margin-bottom: 0.85rem; svg { color: ${theme.success}; }`;
const AvailableDatesGrid = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; max-height: 180px; overflow-y: auto; @media (max-width: 360px) { grid-template-columns: 1fr; }`;
const AvailableDateButton = styled.button`
  padding: 0.65rem 0.85rem; background: ${theme.cardBgLight}; border: 2px solid ${theme.borderLight}; border-radius: 10px; font-size: 0.82rem; font-weight: 600; color: ${theme.textDark}; cursor: pointer; transition: all 0.2s ease; text-align: left;
  .day { display: block; font-size: 0.9rem; font-weight: 700; color: ${theme.primary}; }
  .full-date { display: block; font-size: 0.75rem; color: ${theme.textLight}; margin-top: 2px; }
  &:hover { background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark}); border-color: ${theme.primary}; transform: translateY(-2px); .day, .full-date { color: white; } }
`;
const AvailableMonthsSection = styled.div`margin-top: 1.25rem; padding-top: 1.25rem; border-top: 2px dashed ${theme.borderLight};`;
const AvailableMonthsTitle = styled.div`display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: ${theme.textDark}; margin-bottom: 0.85rem; svg { color: ${theme.primary}; }`;
const MonthsGrid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; @media (max-width: 360px) { grid-template-columns: repeat(2, 1fr); }`;
const MonthBadge = styled.div`
  padding: 0.55rem 0.65rem;
  background: ${props => props.isCurrentMonth ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.cardBgLight};
  border: 2px solid ${props => props.isCurrentMonth ? theme.primary : theme.borderLight}; border-radius: 10px; text-align: center; font-size: 0.82rem; font-weight: 600;
  color: ${props => props.isCurrentMonth ? 'white' : theme.textLight};
  .month-name { display: block; font-weight: 700; }
  .month-status { display: block; font-size: 0.65rem; margin-top: 2px; opacity: 0.8; }
`;
const MonthsHelpText = styled.div`margin-top: 0.85rem; padding: 0.65rem 0.85rem; background: rgba(33, 150, 243, 0.08); border: 1px solid rgba(33, 150, 243, 0.2); border-radius: 10px; font-size: 0.82rem; color: #64B5F6; display: flex; align-items: flex-start; gap: 0.5rem; svg { flex-shrink: 0; margin-top: 2px; }`;
const NoAvailableDatesMessage = styled.div`background: rgba(239, 83, 80, 0.1); border: 2px solid #EF5350; border-radius: 12px; padding: 1.1rem; text-align: center; color: #EF5350; font-weight: 600; svg { display: block; margin: 0 auto 0.5rem; font-size: 1.4rem; }`;
const PopupFooter = styled.div`padding: 0.85rem 1.5rem 1.25rem; display: flex; gap: 0.65rem; @media (max-width: 480px) { flex-direction: column-reverse; padding: 0.85rem 1rem; }`;
const PopupButton = styled.button`flex: 1; padding: 0.8rem 1.1rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-family: 'Sora', sans-serif; @media (max-width: 480px) { padding: 0.75rem 1rem; font-size: 0.85rem; }`;
const ClosePopupButton = styled(PopupButton)`background: ${theme.cardBgLight}; border: 2px solid ${theme.borderLight}; color: ${theme.textLight}; &:hover { background: ${theme.mediumGray}; color: ${theme.textDark}; }`;
const ChooseAnotherButton = styled(PopupButton)`background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark}); border: none; color: white; box-shadow: 0 4px 12px ${theme.primaryGlow}; &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px ${theme.primaryGlow}; }`;

const LoadingContainer = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1.5rem;`;
const LoadingSpinner = styled.div`width: 56px; height: 56px; border: 4px solid rgba(255, 107, 53, 0.15); border-radius: 50%; border-top: 4px solid ${theme.primary}; animation: ${spin} 1s linear infinite;`;
const LoadingText = styled.p`font-size: 1rem; color: rgba(255,255,255,0.6); font-weight: 500;`;
const ErrorContainer = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1.25rem; text-align: center; padding: 2rem;`;
const ErrorTitle = styled.h2`color: white; font-size: 1.4rem; font-family: 'Sora', sans-serif;`;
const ErrorText = styled.p`color: rgba(255,255,255,0.6); font-size: 0.95rem;`;
const GoBackButton = styled(Button)`background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark}); border: none; color: white; margin-top: 0.75rem;`;

// ============================================
// MAIN COMPONENT
// ============================================
const BookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [trek, setTrek] = useState(location.state?.trek || null);
  const [loading, setLoading] = useState(!location.state?.trek);
  const [fetchError, setFetchError] = useState(null);
  const [calendarOpenDate, setCalendarOpenDate] = useState(null);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ startDate: '', totalParticipants: 1, specialRequests: '' });
  const [primaryBooker, setPrimaryBooker] = useState({ name: '', email: '', contactNumber: '' });
  const [participants, setParticipants] = useState([{ participantId: 'p1', name: '', email: '', age: '', emergencyContact: '', isPrimaryBooker: true }]);

  const [errors, setErrors] = useState({});
  const [bookingId, setBookingId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [activeCoupon, setActiveCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [isDateCardOpen, setIsDateCardOpen] = useState(false);
  const [isParticipantCardOpen, setIsParticipantCardOpen] = useState(false);
  const [currentExpandedBox, setCurrentExpandedBox] = useState(null);
  const [completedBoxes, setCompletedBoxes] = useState(new Set());
  const [selectedDateFormatted, setSelectedDateFormatted] = useState('');

  const [showUnavailableDatePopup, setShowUnavailableDatePopup] = useState(false);
  const [selectedUnavailableDate, setSelectedUnavailableDate] = useState(null);

  const today = new Date();
  const basePrice = trek?.numericPrice || parseInt(trek?.price?.replace(/[^0-9]/g, '')) || 0;

  // ── Fetch trek ──
  useEffect(() => {
    const fetchTrek = async () => {
      if (trek) { setLoading(false); return; }
      try {
        setLoading(true);
        const trekDoc = await getDoc(doc(db, 'treks', id));
        if (trekDoc.exists()) setTrek({ id: trekDoc.id, ...trekDoc.data() });
        else setFetchError('Trek not found');
      } catch { setFetchError('Failed to load trek details'); }
      finally { setLoading(false); }
    };
    fetchTrek();
  }, [id, trek]);

  // ── Fetch user ──
  useEffect(() => {
    const getCurrentUser = async () => {
      if (auth.currentUser) {
        let userProfileData = {};
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) userProfileData = userDoc.data();
        } catch {}
        const bookerInfo = {
          name: auth.currentUser.displayName || userProfileData.name || userProfileData.firstName || '',
          email: auth.currentUser.email || userProfileData.email || '',
          contactNumber: userProfileData.phone || userProfileData.phoneNumber || userProfileData.contactNumber || auth.currentUser.phoneNumber || '',
        };
        setPrimaryBooker(bookerInfo);
        setParticipants([{ participantId: 'p1', name: bookerInfo.name, email: bookerInfo.email, age: userProfileData.age || '', emergencyContact: bookerInfo.contactNumber, isPrimaryBooker: true }]);
      } else { navigate('/login', { state: { redirectTo: `/booking/${id}` } }); }
    };
    if (trek) {
      getCurrentUser();
      setActiveCoupon(null);
      setDiscountAmount(0);
      loadRazorpayScript().catch(() => setPaymentError("Failed to load payment gateway."));
    }
  }, [trek, id, navigate]);

  // ── Helpers ──
  const getFirstAvailableDate = useCallback(() => {
    const td = new Date(); td.setHours(0,0,0,0);
    if (trek?.availableDates?.length) { const f = trek.availableDates.filter(d => { const dd = new Date(d); dd.setHours(0,0,0,0); return dd >= td; }).sort((a,b) => new Date(a)-new Date(b)); if (f.length) return new Date(f[0]); }
    if (trek?.availableMonths?.length) { const c = td.getMonth(), y = td.getFullYear(), s = [...trek.availableMonths].sort((a,b)=>a-b), n = s.find(m=>m>=c); if (n !== undefined) { if (n===c) return td; return new Date(y,n,1); } return new Date(y+1,s[0],1); }
    return td;
  }, [trek]);

  const isDateAvailable = useCallback((ds) => {
    const d = new Date(ds); if (d < today) return false;
    if (trek?.availableDates?.length) { const f = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; return trek.availableDates.includes(f); }
    if (trek?.availableMonths?.length) return trek.availableMonths.includes(d.getMonth());
    return true;
  }, [trek]);

  const formatDateForDisplay = (ds) => { if (!ds) return ''; return new Date(ds).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); };
  const formatDateForPopup = (ds) => { const d = new Date(ds); return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }; };
  const getFutureAvailableDates = () => { if (!trek?.availableDates) return []; const td = new Date(); td.setHours(0,0,0,0); return trek.availableDates.filter(d => new Date(d) >= td).sort((a,b)=>new Date(a)-new Date(b)).slice(0,6); };
  const getAvailableMonths = () => {
    const mn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (trek?.availableMonths?.length) { const cm = new Date().getMonth(); return trek.availableMonths.sort((a,b)=>a-b).map(mi => ({ index: mi, name: mn[mi], shortName: mn[mi].substring(0,3), isCurrentMonth: mi===cm, isFutureMonth: mi>=cm })); }
    return [];
  };
  const getNextAvailableMonth = () => { const ms = getAvailableMonths(); const cm = new Date().getMonth(); const fm = ms.find(m=>m.index>=cm); if (fm) return fm.name; if (ms.length) return `${ms[0].name} (next year)`; return null; };

  // ── Pricing ──
  const calculateTotalPrice = useCallback(() => {
    const sub = basePrice * formData.totalParticipants;
    return activeCoupon ? Math.max(sub - discountAmount, 0) : sub;
  }, [basePrice, formData.totalParticipants, activeCoupon, discountAmount]);

  // ★ 20% upfront, 80% remaining
  const calculateUpfront = useCallback(() => Math.ceil(calculateTotalPrice() * 0.20), [calculateTotalPrice]);
  const calculateRemaining = useCallback(() => calculateTotalPrice() - calculateUpfront(), [calculateTotalPrice, calculateUpfront]);

  // ── Handlers ──
  const handleDateCardToggle = (e) => { e.stopPropagation(); const opening = !isDateCardOpen; setIsDateCardOpen(opening); setIsParticipantCardOpen(false); if (opening) setCalendarOpenDate(getFirstAvailableDate()); };
  const handleParticipantCardToggle = (e) => { e.stopPropagation(); setIsParticipantCardOpen(!isParticipantCardOpen); setIsDateCardOpen(false); };
  const handleDateSelect = (date) => {
    if (!date) return;
    const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    if (!isDateAvailable(ds)) { setSelectedUnavailableDate(date); setShowUnavailableDatePopup(true); return; }
    setFormData(prev => ({ ...prev, startDate: ds })); setSelectedDateFormatted(formatDateForDisplay(ds)); setIsDateCardOpen(false); if (errors.startDate) setErrors(prev => ({ ...prev, startDate: undefined }));
  };
  const handleSelectAvailableDate = (ds) => { setFormData(prev => ({ ...prev, startDate: ds })); setSelectedDateFormatted(formatDateForDisplay(ds)); setShowUnavailableDatePopup(false); setSelectedUnavailableDate(null); setIsDateCardOpen(false); if (errors.startDate) setErrors(prev => ({ ...prev, startDate: undefined })); };
  const handleChooseAnotherDate = () => { setShowUnavailableDatePopup(false); setSelectedUnavailableDate(null); setIsDateCardOpen(true); };
  const handleCloseUnavailablePopup = () => { setShowUnavailableDatePopup(false); setSelectedUnavailableDate(null); };
  const handleParticipantSelect = (count) => {
    const cur = [...participants];
    if (count > cur.length) { const n = Array.from({ length: count-cur.length }, (_,i) => ({ participantId: `p${cur.length+i+1}`, name: '', email: '', age: '', emergencyContact: '', isPrimaryBooker: false })); setParticipants([...cur, ...n]); }
    else if (count < cur.length) setParticipants(cur.slice(0, count));
    setFormData(prev => ({ ...prev, totalParticipants: count })); setIsParticipantCardOpen(false);
  };
  const handleBoxClick = (boxId) => { if (currentExpandedBox === boxId) return; setCurrentExpandedBox(boxId); };
  const handleDoneClick = (boxId) => { setCompletedBoxes(prev => new Set([...prev, boxId])); if (boxId === 'primary') setCurrentExpandedBox('participant-0'); else { const ci = parseInt(boxId.split('-')[1]); if (ci < participants.length-1) setCurrentExpandedBox(`participant-${ci+1}`); else setCurrentExpandedBox(null); } };
  const handlePreviousBox = () => { if (!currentExpandedBox || currentExpandedBox === 'primary') return; if (currentExpandedBox === 'participant-0') setCurrentExpandedBox('primary'); else { const ci = parseInt(currentExpandedBox.split('-')[1]); setCurrentExpandedBox(`participant-${ci-1}`); } };
  const isBoxValid = (boxId) => {
    if (boxId === 'primary') return primaryBooker.name && primaryBooker.email && /^\d{10}$/.test(primaryBooker.contactNumber);
    const idx = parseInt(boxId.split('-')[1]); return participants[idx]?.name?.trim() !== '';
  };
  const handlePrimaryBookerChange = (field, value) => { setPrimaryBooker(prev => ({ ...prev, [field]: value })); if (participants[0]?.isPrimaryBooker) { const u = [...participants]; u[0] = { ...u[0], [field]: value }; setParticipants(u); } if (errors[`primaryBooker_${field}`]) setErrors(prev => ({ ...prev, [`primaryBooker_${field}`]: undefined })); };
  const handleParticipantChange = (idx, field, value) => { const u = [...participants]; u[idx] = { ...u[idx], [field]: value }; setParticipants(u); if (errors[`participant_${idx}_${field}`]) setErrors(prev => ({ ...prev, [`participant_${idx}_${field}`]: undefined })); };
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined })); };
  const validateForm = () => {
    const e = {};
    if (!formData.startDate) e.startDate = "Start date is required";
    else if (!isDateAvailable(formData.startDate)) e.startDate = "Selected date is not available.";
    if (!primaryBooker.name) e.primaryBooker_name = "Your name is required";
    if (!primaryBooker.email) e.primaryBooker_email = "Your email is required";
    else if (!/\S+@\S+\.\S+/.test(primaryBooker.email)) e.primaryBooker_email = "Email is invalid";
    if (!primaryBooker.contactNumber) e.primaryBooker_contactNumber = "Contact number is required";
    else if (!/^\d{10}$/.test(primaryBooker.contactNumber)) e.primaryBooker_contactNumber = "Must be 10 digits";
    participants.forEach((p, i) => { if (!p.name?.trim()) e[`participant_${i}_name`] = `Participant ${i+1} name required`; if (p.email && !/\S+@\S+\.\S+/.test(p.email)) e[`participant_${i}_email`] = `Invalid email`; });
    setErrors(e); return Object.keys(e).length === 0;
  };
  const handleSubmit = (e) => { e.preventDefault(); if (validateForm()) setStep(2); };
  const handleApplyCoupon = (coupon) => { if (coupon) { setActiveCoupon(coupon); setDiscountAmount(coupon.calculatedDiscount); setPaymentError(null); } else { setActiveCoupon(null); setDiscountAmount(0); } };

  // ★ Payment — charges only 20% via Razorpay
  const handlePaymentProcess = async () => {
    try {
      setIsProcessingPayment(true); setPaymentError(null);
      const fullTrekCost = calculateTotalPrice();  // e.g. ₹6,170
      const upfront = calculateUpfront();          // e.g. ₹1,234 (20%)
      const remain = calculateRemaining();         // e.g. ₹4,936 (80%)

      const bookingData = {
        primaryBooker: { uid: auth.currentUser?.uid || null, ...primaryBooker },
        participants, trekId: trek.id, trekName: trek.name, startDate: formData.startDate,
        pricePerPerson: basePrice, totalParticipants: formData.totalParticipants,
        subtotal: basePrice * formData.totalParticipants, discount: discountAmount,
        totalAmount: fullTrekCost,          // ★ FULL cost for DB
        upfrontAmount: upfront,             // ★ 20% for DB
        remainingAmount: remain,            // ★ 80% for DB
        upfrontPercentage: 20,
        coupon: activeCoupon ? { id: activeCoupon.id, code: activeCoupon.code, discount: discountAmount, discountType: activeCoupon.discountType, originalAmount: basePrice * formData.totalParticipants, finalAmount: fullTrekCost } : null,
        specialRequests: formData.specialRequests || '', createdAt: new Date().toISOString()
      };

      // ★ Only charge 20% via Razorpay
      const upfrontPerPerson = Math.ceil(upfront / formData.totalParticipants);
      const trekForPayment = { ...trek, numericPrice: upfrontPerPerson };

      const result = await processBookingPayment(trekForPayment, {
        ...bookingData,
        totalAmount: upfront,    // ★ Override for payment
        amount: upfront,
        paymentAmount: upfront,
      });

      if (result.success) { const oid = result.orderId || `order_${Date.now()}`; setBookingId(oid); window.lastRazorpayBookingId = oid; }
      else setPaymentError(result.error || "Payment failed");
    } catch (err) { setPaymentError(err.message || "Failed to process payment"); }
    finally { setIsProcessingPayment(false); }
  };

  const handlePaymentSuccess = useCallback(async (response) => {
    try {
      setIsProcessingPayment(false); setIsProcessingBooking(true);
      const paymentResponse = { ...response, bookingId: bookingId || response.bookingId || response.razorpay_order_id, orderId: bookingId || response.razorpay_order_id, verifiedBookingId: bookingId, notes: { ...(response.notes || {}), bookingId: bookingId || response.notes?.bookingId, backupId: bookingId } };
      window.lastRazorpayBookingId = bookingId || response.bookingId || response.razorpay_order_id;
      let effectiveBookingId = bookingId || paymentResponse.bookingId || paymentResponse.razorpay_order_id || window.lastRazorpayBookingId;
      if (!effectiveBookingId) { effectiveBookingId = `fallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`; paymentResponse.bookingId = effectiveBookingId; }
      await completeBookingPayment(effectiveBookingId, paymentResponse);
      try {
        const snap = await getDoc(doc(db, 'bookings', effectiveBookingId));
        const data = snap.exists() ? { id: snap.id, ...snap.data() } : {};
        const emailData = { id: effectiveBookingId, bookingId: effectiveBookingId, name: data.name || primaryBooker.name, email: data.email || primaryBooker.email, contactNumber: data.contactNumber || primaryBooker.contactNumber, startDate: data.startDate || formData.startDate, participants: data.participants || formData.totalParticipants, totalAmount: data.totalAmount || calculateTotalPrice(), upfrontAmount: data.upfrontAmount || calculateUpfront(), remainingAmount: data.remainingAmount || calculateRemaining(), paymentId: response.razorpay_payment_id, status: 'confirmed', paymentStatus: 'completed', specialRequests: data.specialRequests || formData.specialRequests || 'None', discountAmount, createdAt: data.createdAt || new Date().toISOString() };
        if (emailData.email) await emailService.sendConfirmationEmail(emailData, trek);
      } catch (emailErr) { console.error('Email error:', emailErr); }
      setIsProcessingBooking(false); setPaymentSuccess(true); setShowSuccessAnimation(true);
      setTimeout(() => navigate(`/booking-confirmation/${effectiveBookingId}`), 3000);
    } catch (err) { setPaymentError(err.message || "Failed to verify payment"); setIsProcessingBooking(false); }
    finally { setIsProcessingPayment(false); }
  }, [bookingId, navigate, formData, primaryBooker, trek, calculateTotalPrice, calculateUpfront, calculateRemaining, discountAmount]);

  const handlePaymentFailure = useCallback(async (error) => { try { if (bookingId) await handleBookingPaymentFailure(bookingId, error); setPaymentError(error.description || error.message || "Payment failed"); } catch { setPaymentError("Payment failed: " + (error.description || "Unknown error")); } }, [bookingId]);

  useEffect(() => {
    const cur = bookingId; if (cur) window.lastRazorpayBookingId = cur;
    window.onRazorpaySuccess = (r) => handlePaymentSuccess({ ...r, bookingId: cur || r.bookingId || r.razorpay_order_id, verifiedBookingId: cur, orderId: cur || r.razorpay_order_id, notes: { ...(r.notes || {}), bookingId: cur, backupId: cur } });
    window.onRazorpayFailure = handlePaymentFailure;
    return () => { window.onRazorpaySuccess = null; window.onRazorpayFailure = null; };
  }, [bookingId, handlePaymentSuccess, handlePaymentFailure]);

  // ── Computed ──
  const upfront = calculateUpfront();
  const remaining = calculateRemaining();
  const subtotal = basePrice * formData.totalParticipants;

  if (loading) return <PageWrapper><LoadingContainer><LoadingSpinner /><LoadingText>Loading trek details...</LoadingText></LoadingContainer></PageWrapper>;
  if (fetchError || !trek) return <PageWrapper><ErrorContainer><FiAlertCircle size={48} color={theme.primary} /><ErrorTitle>{fetchError || 'Trek not found'}</ErrorTitle><ErrorText>We couldn't find the trek you're looking for.</ErrorText><GoBackButton onClick={() => navigate('/explore')}><FiArrowLeft />Browse Treks</GoBackButton></ErrorContainer></PageWrapper>;

  return (
    <PageWrapper>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {isProcessingBooking && <ProcessingOverlay><ProcessingContent><ProcessingSpinner /><ProcessingTitle>Processing Your Booking</ProcessingTitle><ProcessingSubtitle>Please wait while we confirm your payment...</ProcessingSubtitle></ProcessingContent></ProcessingOverlay>}
      {showSuccessAnimation && <ProcessingOverlay><ProcessingContent><EnhancedSuccessMessage><ConfettiContainer>{Array.from({ length: 15 }).map((_, i) => <ConfettiParticle key={i} color={['#ffeb3b','#4caf50','#2196f3','#ff9800','#e91e63'][i%5]} delay={`${i*0.2}s`} top={`${Math.random()*100}%`} left={`${Math.random()*100}%`} />)}</ConfettiContainer><SuccessIcon><FiCheck size={36} /></SuccessIcon><SuccessTitle>🎉 Booking Confirmed!</SuccessTitle><SuccessSubtitle>Your adventure awaits!</SuccessSubtitle>{activeCoupon && <CouponSuccessDiv><strong>Coupon: {activeCoupon.code}</strong><br/>You saved ₹{discountAmount.toFixed(2)}!</CouponSuccessDiv>}</EnhancedSuccessMessage></ProcessingContent></ProcessingOverlay>}

      {showUnavailableDatePopup && (
        <UnavailableDateOverlay onClick={handleCloseUnavailablePopup}>
          <UnavailableDatePopup onClick={e => e.stopPropagation()}>
            <PopupHeader><PopupIconContainer><FiCalendar /></PopupIconContainer><PopupTitle>Date Not Available</PopupTitle></PopupHeader>
            <PopupBody>
              {selectedUnavailableDate && <PopupDateDisplay><div className="date-label">You selected</div><div className="date-value">{selectedUnavailableDate instanceof Date ? selectedUnavailableDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : formatDateForDisplay(selectedUnavailableDate)}</div></PopupDateDisplay>}
              <PopupMessage>Sorry, this date is not available for <strong>{trek?.name}</strong>.{getFutureAvailableDates().length > 0 ? ' Choose from available dates below.' : getAvailableMonths().length > 0 ? ' Available during specific months.' : ' Contact us for availability.'}</PopupMessage>
              {getFutureAvailableDates().length > 0 && <AvailableDatesSection><AvailableDatesTitle><FiCheck />Available Dates</AvailableDatesTitle><AvailableDatesGrid>{getFutureAvailableDates().map(ds => { const f = formatDateForPopup(ds); return <AvailableDateButton key={ds} onClick={() => handleSelectAvailableDate(ds)}><span className="day">{f.day}</span><span className="full-date">{f.full}</span></AvailableDateButton>; })}</AvailableDatesGrid></AvailableDatesSection>}
              {getFutureAvailableDates().length === 0 && getAvailableMonths().length > 0 && <AvailableMonthsSection><AvailableMonthsTitle><FiCalendar />Available Months</AvailableMonthsTitle><MonthsGrid>{getAvailableMonths().map(m => <MonthBadge key={m.index} isCurrentMonth={m.isCurrentMonth}><span className="month-name">{m.shortName}</span><span className="month-status">{m.isCurrentMonth ? '● Now' : m.isFutureMonth ? 'Available' : 'Next Year'}</span></MonthBadge>)}</MonthsGrid><MonthsHelpText><FiInfo /><span>Specific dates announced soon.{getNextAvailableMonth() && <> Next: <strong>{getNextAvailableMonth()}</strong></>}</span></MonthsHelpText></AvailableMonthsSection>}
              {getFutureAvailableDates().length === 0 && getAvailableMonths().length === 0 && <NoAvailableDatesMessage><FiAlertCircle /><div><strong>No availability info</strong><p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', fontWeight: 'normal' }}>Contact us for dates.</p></div></NoAvailableDatesMessage>}
            </PopupBody>
            <PopupFooter><ClosePopupButton onClick={handleCloseUnavailablePopup}>Cancel</ClosePopupButton><ChooseAnotherButton onClick={handleChooseAnotherDate}><FiCalendar />Choose Another Date</ChooseAnotherButton></PopupFooter>
          </UnavailableDatePopup>
        </UnavailableDateOverlay>
      )}

      <BookingCard>
        <OrangePanel>
          <FloatingCircle size="180px" top="-40px" right="-60px" opacity="0.08" />
          <FloatingCircle size="100px" top="30%" left="-30px" opacity="0.06" />
          <FloatingCircle size="60px" bottom="25%" right="20px" opacity="0.1" />
          <CurvedDivider>
            <svg className="desktop-curve" viewBox="0 0 80 800" preserveAspectRatio="none"><path d="M 40 0 Q 0 200 40 400 Q 80 600 40 800 L 80 800 L 80 0 Z" fill="#1a1d23" /></svg>
            <svg className="mobile-curve" viewBox="0 0 390 40" preserveAspectRatio="none"><path d="M0,8 C45,34 105,-4 170,16 C235,36 300,2 390,10 L390,40 L0,40 Z" fill="#1a1d23" /></svg>
          </CurvedDivider>
          <FloatingImageContainer>
            <TrekImageCard><img src={trek?.image} alt={trek?.name} /></TrekImageCard>
          </FloatingImageContainer>
          <OrangePanelInfo>
            <PanelTrekName>{trek?.name}</PanelTrekName>
            <PanelLocation>📍 {trek?.location}</PanelLocation>
            <PriceTag>
              <span className="currency">₹</span>
              <span className="amount">{basePrice.toLocaleString('en-IN')}</span>
              <span className="suffix">/ person</span>
            </PriceTag>
          </OrangePanelInfo>
        </OrangePanel>

        <DarkFormPanel>
          <PanelHeader>
            <HeaderTop>
              <BackBtn onClick={() => step === 2 ? setStep(1) : navigate(-1)}><FiArrowLeft /></BackBtn>
              <HeaderTitle>{step === 1 ? 'Book Your ' : 'Payment '}<span>{step === 1 ? 'Adventure' : 'Details'}</span></HeaderTitle>
            </HeaderTop>
            <div style={{ paddingBottom: '0.5rem' }}>
              <StepTrack>
                <StepItem><StepDot active={step === 1} completed={step > 1} /><StepLabel active={step === 1} completed={step > 1}>Details</StepLabel></StepItem>
                <StepLine completed={step > 1} />
                <StepItem><StepDot active={step === 2} completed={paymentSuccess} /><StepLabel active={step === 2} completed={paymentSuccess}>Payment</StepLabel></StepItem>
              </StepTrack>
            </div>
          </PanelHeader>

          <PanelBody>
            {step === 1 && (
              <Form onSubmit={handleSubmit}>
                <TwoCardRow>
                  <InteractiveCard isOpen={isDateCardOpen} onClick={handleDateCardToggle}>
                    <CardHeader><CardLabel><FiCalendar />Trek Date</CardLabel>{formData.startDate && <SelectedBadge>✓</SelectedBadge>}</CardHeader>
                    <CardValue>{formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}<CardArrow isOpen={isDateCardOpen} /></CardValue>
                    <CardDropdown isOpen={isDateCardOpen} onClick={e => e.stopPropagation()}>
                      <CalendarWrapper>
                        <DatePicker selected={formData.startDate ? new Date(formData.startDate) : null} onChange={handleDateSelect} inline minDate={new Date()} openToDate={calendarOpenDate || getFirstAvailableDate()} renderDayContents={(day, date) => { if (!date) return <DayNumber>{day}</DayNumber>; const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; if (date < new Date(new Date().setHours(0,0,0,0))) return <DayNumber>{day}</DayNumber>; return <DayWithDot><DayNumber>{day}</DayNumber><DayDot available={isDateAvailable(ds)} /></DayWithDot>; }} />
                      </CalendarWrapper>
                    </CardDropdown>
                  </InteractiveCard>
                  <InteractiveCard isOpen={isParticipantCardOpen} onClick={handleParticipantCardToggle}>
                    <CardHeader><CardLabel><FiUser />People</CardLabel></CardHeader>
                    <CardValue>{formData.totalParticipants} {formData.totalParticipants === 1 ? 'Person' : 'People'}<CardArrow isOpen={isParticipantCardOpen} /></CardValue>
                    <CardDropdown isOpen={isParticipantCardOpen} onClick={e => e.stopPropagation()}>
                      <ParticipantCounterWrapper>
                        <CounterButton type="button" disabled={formData.totalParticipants <= 1} onClick={e => { e.stopPropagation(); if (formData.totalParticipants > 1) { handleParticipantSelect(formData.totalParticipants - 1); setIsParticipantCardOpen(true); } }}>−</CounterButton>
                        <CounterDisplay><CounterNumber>{formData.totalParticipants}</CounterNumber><CounterLabel>{formData.totalParticipants === 1 ? 'Person' : 'People'}</CounterLabel></CounterDisplay>
                        <CounterButton type="button" disabled={formData.totalParticipants >= 10} onClick={e => { e.stopPropagation(); if (formData.totalParticipants < 10) { handleParticipantSelect(formData.totalParticipants + 1); setIsParticipantCardOpen(true); } }}>+</CounterButton>
                      </ParticipantCounterWrapper>
                      <CounterInfoRow><span>Min: 1</span><span>₹{(basePrice * formData.totalParticipants).toLocaleString('en-IN')}</span><span>Max: 10</span></CounterInfoRow>
                    </CardDropdown>
                  </InteractiveCard>
                </TwoCardRow>
                {errors.startDate && <ErrorSpan style={{ marginTop: '-0.5rem' }}>{errors.startDate}</ErrorSpan>}

                <DetailBox isExpanded={currentExpandedBox === 'primary'} data-expanded={currentExpandedBox === 'primary'} onClick={() => currentExpandedBox !== 'primary' && handleBoxClick('primary')}>
                  <DetailBoxHeader isExpanded={currentExpandedBox === 'primary'}>
                    <DetailBoxTitle><FiUser />Your Details<StatusDot completed={completedBoxes.has('primary')} /></DetailBoxTitle>
                    {currentExpandedBox !== 'primary' && <span style={{ fontSize: '0.8rem', color: theme.textLight }}>{completedBoxes.has('primary') ? '✓ Done' : ''}</span>}
                  </DetailBoxHeader>
                  <DetailBoxContent isExpanded={currentExpandedBox === 'primary'}>
                    <FormGroup style={{ marginTop: 0 }}><Label>Full Name *</Label><Input type="text" value={primaryBooker.name} onChange={e => handlePrimaryBookerChange('name', e.target.value)} placeholder="Enter your full name" onClick={e => e.stopPropagation()} />{errors.primaryBooker_name && <ErrorSpan>{errors.primaryBooker_name}</ErrorSpan>}</FormGroup>
                    <FieldRow>
                      <FormGroup><Label>Email *</Label><Input type="email" value={primaryBooker.email} onChange={e => handlePrimaryBookerChange('email', e.target.value)} placeholder="your@email.com" onClick={e => e.stopPropagation()} />{errors.primaryBooker_email && <ErrorSpan>{errors.primaryBooker_email}</ErrorSpan>}</FormGroup>
                      <FormGroup><Label>Contact *</Label><Input type="tel" value={primaryBooker.contactNumber} onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,10); handlePrimaryBookerChange('contactNumber', v); }} placeholder="10-digit number" onClick={e => e.stopPropagation()} maxLength={10} style={{ borderColor: primaryBooker.contactNumber.length > 0 && primaryBooker.contactNumber.length !== 10 ? '#EF5350' : primaryBooker.contactNumber.length === 10 ? '#4CAF50' : undefined }} />{primaryBooker.contactNumber.length > 0 && primaryBooker.contactNumber.length !== 10 && <ErrorSpan>{primaryBooker.contactNumber.length < 10 ? `${10 - primaryBooker.contactNumber.length} more digit(s)` : 'Must be 10 digits'}</ErrorSpan>}{errors.primaryBooker_contactNumber && primaryBooker.contactNumber.length === 0 && <ErrorSpan>{errors.primaryBooker_contactNumber}</ErrorSpan>}</FormGroup>
                    </FieldRow>
                    <DoneButton type="button" onClick={e => { e.stopPropagation(); if (isBoxValid('primary')) handleDoneClick('primary'); }} disabled={!isBoxValid('primary')}><FiCheck />Done – Continue</DoneButton>
                  </DetailBoxContent>
                </DetailBox>

                {participants.map((p, idx) => (
                  <DetailBox key={p.participantId} isExpanded={currentExpandedBox === `participant-${idx}`} data-expanded={currentExpandedBox === `participant-${idx}`} isDisabled={!completedBoxes.has('primary')} onClick={() => { if (completedBoxes.has('primary') && currentExpandedBox !== `participant-${idx}`) handleBoxClick(`participant-${idx}`); }}>
                    <DetailBoxHeader isExpanded={currentExpandedBox === `participant-${idx}`}>
                      <DetailBoxTitle><FiUser />Participant {idx + 1} {p.isPrimaryBooker && '(You)'}<StatusDot completed={completedBoxes.has(`participant-${idx}`)} /></DetailBoxTitle>
                      {currentExpandedBox !== `participant-${idx}` && <span style={{ fontSize: '0.8rem', color: theme.textLight }}>{completedBoxes.has(`participant-${idx}`) ? '✓ Done' : ''}</span>}
                    </DetailBoxHeader>
                    <DetailBoxContent isExpanded={currentExpandedBox === `participant-${idx}`}>
                      <FieldRow style={{ marginTop: 0 }}>
                        <FormGroup><Label>Full Name *</Label><Input value={p.name} onChange={e => handleParticipantChange(idx, 'name', e.target.value)} placeholder="Full name" disabled={p.isPrimaryBooker} onClick={e => e.stopPropagation()} />{errors[`participant_${idx}_name`] && <ErrorSpan>{errors[`participant_${idx}_name`]}</ErrorSpan>}</FormGroup>
                        <FormGroup><Label>Email {!p.isPrimaryBooker && '(Optional)'}</Label><Input type="email" value={p.email} onChange={e => handleParticipantChange(idx, 'email', e.target.value)} placeholder="Email" disabled={p.isPrimaryBooker} onClick={e => e.stopPropagation()} /></FormGroup>
                      </FieldRow>
                      <FieldRow>
                        <FormGroup><Label>Age (Optional)</Label><Input type="number" value={p.age} onChange={e => handleParticipantChange(idx, 'age', e.target.value)} placeholder="Age" min="1" max="100" onClick={e => e.stopPropagation()} /></FormGroup>
                        <FormGroup><Label>Emergency Contact</Label><Input type="tel" value={p.emergencyContact} onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,10); handleParticipantChange(idx, 'emergencyContact', v); }} placeholder="10-digit number" onClick={e => e.stopPropagation()} maxLength={10} style={{ borderColor: p.emergencyContact?.length > 0 && p.emergencyContact?.length !== 10 ? '#EF5350' : p.emergencyContact?.length === 10 ? '#4CAF50' : undefined }} />{p.emergencyContact?.length > 0 && p.emergencyContact?.length !== 10 && <ErrorSpan>{p.emergencyContact.length < 10 ? `${10 - p.emergencyContact.length} more digit(s)` : 'Must be 10 digits'}</ErrorSpan>}</FormGroup>
                      </FieldRow>
                      <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {idx > 0 && <DoneButton type="button" onClick={e => { e.stopPropagation(); handlePreviousBox(); }} style={{ background: 'transparent', color: theme.primary, border: `2px solid ${theme.primary}`, boxShadow: 'none' }}>← Previous</DoneButton>}
                        <DoneButton type="button" onClick={e => { e.stopPropagation(); if (isBoxValid(`participant-${idx}`)) handleDoneClick(`participant-${idx}`); }} disabled={!isBoxValid(`participant-${idx}`)}><FiCheck />{idx === participants.length - 1 ? 'Done' : 'Next Participant'}</DoneButton>
                      </div>
                    </DetailBoxContent>
                  </DetailBox>
                ))}

                <FormGroup><Label><FiMessageSquare />Special Requests (Optional)</Label><Textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} placeholder="Dietary requirements, accessibility needs..." /></FormGroup>
              </Form>
            )}

            {step === 2 && (
              <>
                <SecurePaymentBanner><FiCheck />Secure Payment — Only 20% charged now</SecurePaymentBanner>

                <BookingSummaryCard>
                  <SummaryHeader><SectionIcon><FiInfo /></SectionIcon><SummaryTitle>Booking Summary</SummaryTitle></SummaryHeader>
                  <SummaryGrid>
                    <SummaryItem><strong>Trek:</strong> {trek?.name}</SummaryItem>
                    <SummaryItem><strong>Date:</strong> {formatDateForDisplay(formData.startDate)}</SummaryItem>
                    <SummaryItem><strong>Participants:</strong> {formData.totalParticipants} person(s)</SummaryItem>
                    <SummaryItem><strong>Price/Person:</strong> ₹{basePrice.toLocaleString('en-IN')}</SummaryItem>
                  </SummaryGrid>
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: `1px solid ${theme.borderLight}` }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: theme.textLight, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participants:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>{participants.map((p, i) => <ParticipantChip key={i} isPrimary={p.isPrimaryBooker}>{p.name || `Participant ${i+1}`}{p.isPrimaryBooker && ' ✓'}</ParticipantChip>)}</div>
                  </div>
                </BookingSummaryCard>

                <CouponSection orderTotal={basePrice * formData.totalParticipants} onApplyCoupon={handleApplyCoupon} />

                {/* ★ Payment Split Card */}
                <PaymentSplitCard>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: theme.textDark, fontFamily: "'Sora', sans-serif" }}>
                    <FiInfo color={theme.primary} /> How Payment Works
                  </div>
                  <SplitGrid>
                    <SplitItem $active>
                      <SplitPercent $active>20%</SplitPercent>
                      <SplitLabel>Paid now online<br/>(Booking confirmation)</SplitLabel>
                      <SplitAmount $active>₹{upfront.toLocaleString('en-IN')}</SplitAmount>
                    </SplitItem>
                    <SplitItem>
                      <SplitPercent>80%</SplitPercent>
                      <SplitLabel>Paid directly to<br/>the trek organizer</SplitLabel>
                      <SplitAmount>₹{remaining.toLocaleString('en-IN')}</SplitAmount>
                    </SplitItem>
                  </SplitGrid>
                  <SplitNote><FiInfo size={12} />A small processing fee (~2.5%) applies on the 20% paid via Razorpay. The remaining 80% is settled directly with the organizer on your trek day.</SplitNote>
                </PaymentSplitCard>

                <PriceSummary>
                  <PriceItem><span>Trek Fee (per person)</span><span>₹{basePrice.toLocaleString('en-IN')}</span></PriceItem>
                  <PriceItem><span>Participants</span><span>× {formData.totalParticipants}</span></PriceItem>
                  {activeCoupon && <PriceItem style={{ color: '#6BCB77' }}><span>Discount ({activeCoupon.code})</span><span>−₹{discountAmount.toFixed(2)}</span></PriceItem>}
                  <PriceItem><span>Total Trek Cost</span><span>₹{calculateTotalPrice().toLocaleString('en-IN')}</span></PriceItem>
                  <PriceTotal><span>Pay Now (20%)</span><span>₹{upfront.toLocaleString('en-IN')}</span></PriceTotal>
                </PriceSummary>

                {paymentError && <ErrorMessage><FiAlertCircle size={18} />{paymentError}</ErrorMessage>}
                {paymentSuccess && <SuccessMessage><FiCheck size={18} /><div>Payment successful! Your booking is confirmed.{activeCoupon && <div style={{ marginTop: '8px' }}>Coupon: {activeCoupon.code} (Saved: ₹{discountAmount.toFixed(2)})</div>}</div></SuccessMessage>}
              </>
            )}
          </PanelBody>

          <PanelFooter>
            {step === 1 ? (
              <>
                <CancelButton type="button" onClick={() => navigate(-1)}>Cancel</CancelButton>
                <ProceedButton type="button" onClick={handleSubmit}>Continue to Payment <FiArrowLeft style={{ transform: 'rotate(180deg)' }} /></ProceedButton>
              </>
            ) : (
              <>
                <CancelButton type="button" onClick={() => setStep(1)}>← Back</CancelButton>
                <PaymentButton type="button" onClick={handlePaymentProcess} disabled={isProcessingPayment || paymentSuccess}>
                  {isProcessingPayment ? <LoadingIndicator /> : paymentSuccess ? <><FiCheck />Paid</> : <><FiLock />Pay ₹{upfront.toLocaleString('en-IN')} Now</>}
                </PaymentButton>
              </>
            )}
          </PanelFooter>
        </DarkFormPanel>
      </BookingCard>
    </PageWrapper>
  );
};

export default BookingPage;