import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiCheckCircle, FiMapPin, FiCalendar, FiUsers, FiCreditCard,
  FiFileText, FiPhone, FiArrowLeft, FiShare2,
  FiShield, FiAlertCircle, FiUser, FiClock, FiInfo, FiChevronRight
} from 'react-icons/fi';
import BookingService from '../services/BookingService';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { T as theme } from '../theme.js';

// ─────────────────────────────────────────────
// ANIMATIONS
// ─────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;
const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`;
const popIn = keyframes`
  0%   { opacity: 0; transform: scale(0.88); }
  60%  { transform: scale(1.03); }
  100% { opacity: 1; transform: scale(1); }
`;
const successRing = keyframes`
  0%   { box-shadow: 0 0 0 0   rgba(34,197,94,0.5); }
  70%  { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0   rgba(34,197,94,0); }
`;
const glowPulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
`;

// ─────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${theme.bg};
  color: ${theme.textPrimary};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 130px;
  @media (max-width: 600px) { padding-bottom: 160px; }
`;

// ─────────────────────────────────────────────
// ★ PREMIUM TOP BAR
// ─────────────────────────────────────────────
const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(180deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.88) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  padding: 0;
  height: auto;
`;

const TopBarInner = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  @media (max-width: 480px) { padding: 0.625rem 1rem; gap: 0.625rem; }
`;

const BackBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: ${theme.textPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
  &:hover {
    background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
    border-color: ${theme.primary};
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(249,115,22,0.3);
  }
  &:active { transform: scale(0.97); }
  @media (max-width: 480px) { width: 36px; height: 36px; border-radius: 10px; }
`;

const TopBarContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const TopBarLabel = styled.div`
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${theme.success};
  line-height: 1;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  @media (max-width: 480px) { font-size: 0.58rem; }
`;

const TopBarTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${theme.textPrimary};
  letter-spacing: -0.025em;
  margin: 0;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  @media (max-width: 480px) { font-size: 1.08rem; }
`;

const TopBarTitleAccent = styled.span`
  background: linear-gradient(135deg, #22c55e 0%, #4ade80 60%, #86efac 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-shrink: 0;
`;

const TopBarBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.15);
  border-radius: 100px;
  font-size: 0.68rem;
  font-weight: 700;
  color: ${theme.success};
  white-space: nowrap;
  svg { font-size: 0.72rem; animation: ${glowPulse} 2s ease-in-out infinite; }
  @media (max-width: 480px) {
    padding: 0.3rem 0.5rem;
    font-size: 0.6rem;
    span { display: none; }
  }
`;

const IconBtn = styled.button`
  width: 36px; height: 36px; border-radius: 8px;
  border: 1px solid ${theme.border}; background: rgba(255,255,255,0.04);
  color: ${theme.textSecondary}; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease;
  &:hover { color: ${theme.primary}; border-color: ${theme.primary}; }
`;

const PageBody = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  @media (max-width: 768px) { padding: 1.25rem 1rem; }
  @media (max-width: 480px) { padding: 1rem 0.875rem; }
`;

// ─────────────────────────────────────────────
// SUCCESS HERO
// ─────────────────────────────────────────────
const SuccessHero = styled.div`
  text-align: center;
  padding: 2.5rem 1rem;
  animation: ${fadeUp} 0.6s ease both;
`;

const SuccessCircle = styled.div`
  width: 80px; height: 80px; border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16803d);
  display: flex; align-items: center; justify-content: center;
  color: white; margin: 0 auto 1.5rem;
  animation: ${popIn} 0.6s ease, ${successRing} 2s ease 0.6s;
  box-shadow: 0 8px 28px rgba(34,197,94,0.35);
`;

const SuccessTitle = styled.h1`
  font-size: 1.875rem; font-weight: 800; color: ${theme.textPrimary};
  letter-spacing: -0.02em; margin: 0 0 0.5rem;
  @media (max-width: 480px) { font-size: 1.5rem; }
`;

const SuccessSubtitle = styled.p`
  font-size: 1rem; color: ${theme.textMuted}; margin: 0 0 1.25rem; line-height: 1.6;
`;

const BookingIdPill = styled.div`
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2);
  border-radius: 100px; font-family: 'Courier New', monospace;
  font-size: 0.88rem; font-weight: 700; color: ${theme.primary};
  letter-spacing: 0.05em; position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    animation: ${shimmer} 2s infinite;
  }
`;

// ─────────────────────────────────────────────
// PAYMENT STATUS BANNER
// ─────────────────────────────────────────────
const PayStatusBanner = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
  margin-bottom: 1.5rem; animation: ${fadeUp} 0.5s ease 0.15s both;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const PayStatusItem = styled.div`
  padding: 1rem 1.25rem; border-radius: 12px;
  border: 1px solid ${p => p.$success ? 'rgba(34,197,94,0.25)' : theme.border};
  background: ${p => p.$success ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)'};
`;

const PayStatusLabel = styled.div`
  font-size: 0.72rem; font-weight: 600; color: ${theme.textMuted};
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem;
  display: flex; align-items: center; gap: 0.35rem;
  svg { font-size: 0.8rem; }
`;

const PayStatusValue = styled.div`
  font-size: 1.2rem; font-weight: 800;
  color: ${p => p.$success ? theme.success : theme.textPrimary};
  line-height: 1; margin-bottom: 0.2rem;
`;

const PayStatusNote = styled.div`
  font-size: 0.72rem; color: ${theme.textMuted}; line-height: 1.4;
`;

// ─────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────
const Card = styled.div`
  background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px;
  overflow: hidden; margin-bottom: 1.25rem;
  animation: ${fadeUp} 0.5s ease ${p => p.$delay || '0s'} both;
  transition: border-color 0.25s ease;
  &:hover { border-color: rgba(255,255,255,0.12); }
  @media (max-width: 480px) { border-radius: 12px; }
`;

const CardHead = styled.div`
  padding: 1rem 1.25rem; border-bottom: 1px solid ${theme.border};
  display: flex; align-items: center; gap: 0.75rem; position: relative;
  &::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark}); opacity: 0.6;
  }
`;

const CardIconWrap = styled.div`
  width: 34px; height: 34px; border-radius: 10px;
  background: rgba(249,115,22,0.1); color: ${theme.primary};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const CardTitle = styled.h3`
  font-size: 0.95rem; font-weight: 700; color: ${theme.textPrimary}; margin: 0;
  @media (max-width: 480px) { font-size: 0.88rem; }
`;

const CardBody = styled.div`
  padding: 1.25rem;
  @media (max-width: 480px) { padding: 1rem; }
`;

// ─────────────────────────────────────────────
// DETAIL GRID
// ─────────────────────────────────────────────
const DetailGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.875rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; gap: 0.625rem; }
`;

const DetailItem = styled.div`
  padding: 0.875rem; background: rgba(255,255,255,0.03);
  border: 1px solid ${theme.border}; border-radius: 10px; transition: all 0.2s ease;
  &:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); }
`;

const DetailLabel = styled.div`
  font-size: 0.7rem; font-weight: 600; color: ${theme.textMuted};
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem;
`;

const DetailValue = styled.div`
  font-size: 0.92rem; font-weight: 600; color: ${theme.textPrimary};
  line-height: 1.4; word-break: break-word;
`;

// ─────────────────────────────────────────────
// TREK IMAGE
// ─────────────────────────────────────────────
const TrekImageWrap = styled.div`
  border-radius: 12px; overflow: hidden; height: 200px;
  margin-bottom: 1.25rem; position: relative;
  @media (max-width: 480px) { height: 160px; }
`;

const TrekImage = styled.img`
  width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;
  &:hover { transform: scale(1.04); }
`;

const TrekImageOverlay = styled.div`
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%);
`;

// ─────────────────────────────────────────────
// PARTICIPANT CARDS
// ─────────────────────────────────────────────
const ParticipantGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.875rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; gap: 0.625rem; }
`;

const ParticipantCard = styled.div`
  padding: 1rem; background: rgba(255,255,255,0.03);
  border: 1px solid ${p => p.$primary ? 'rgba(249,115,22,0.25)' : theme.border};
  border-radius: 12px; position: relative; transition: all 0.2s ease;
  &:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); }
`;

const PrimaryBadge = styled.span`
  position: absolute; top: 0.5rem; right: 0.5rem;
  background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
  color: white; font-size: 0.65rem; font-weight: 700;
  padding: 0.2rem 0.5rem; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.03em;
`;

const ParticipantNum = styled.div`
  font-size: 0.72rem; font-weight: 600; color: ${theme.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.4rem;
`;

const ParticipantName = styled.div`
  font-size: 1rem; font-weight: 700; color: ${theme.textPrimary};
  margin-bottom: 0.625rem; padding-right: ${p => p.$hasBadge ? '4rem' : 0};
`;

const ParticipantDetail = styled.div`
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.78rem; color: ${theme.textMuted}; margin-bottom: 0.3rem;
  word-break: break-word;
  &:last-child { margin-bottom: 0; }
  svg { flex-shrink: 0; font-size: 0.8rem; }
`;

// ─────────────────────────────────────────────
// PAYMENT SPLIT
// ─────────────────────────────────────────────
const SplitCard = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const SplitItem = styled.div`
  padding: 1rem;
  background: ${p => p.$paid ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$paid ? 'rgba(34,197,94,0.2)' : theme.border};
  border-radius: 12px;
`;

const SplitPercent = styled.div`
  font-size: 1.5rem; font-weight: 800;
  color: ${p => p.$paid ? theme.success : theme.textSecondary};
  line-height: 1; margin-bottom: 0.25rem;
`;

const SplitLabel = styled.div`
  font-size: 0.75rem; color: ${theme.textMuted}; line-height: 1.4; margin-bottom: 0.4rem;
`;

const SplitAmount = styled.div`
  font-size: 1rem; font-weight: 700;
  color: ${p => p.$paid ? theme.success : theme.textPrimary};
`;

const SplitStatus = styled.span`
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem;
  border-radius: 20px; margin-top: 0.4rem;
  background: ${p => p.$paid ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)'};
  color: ${p => p.$paid ? theme.success : theme.textMuted};
  border: 1px solid ${p => p.$paid ? 'rgba(34,197,94,0.25)' : theme.border};
`;

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
const StatusBadge = styled.span`
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.75rem; border-radius: 20px;
  font-size: 0.78rem; font-weight: 700;
  background: ${p => p.$type === 'success'
    ? 'rgba(34,197,94,0.12)'
    : p.$type === 'warning'
      ? 'rgba(249,115,22,0.12)'
      : 'rgba(255,255,255,0.06)'};
  color: ${p => p.$type === 'success'
    ? theme.success
    : p.$type === 'warning'
      ? theme.primary
      : theme.textMuted};
  border: 1px solid ${p => p.$type === 'success'
    ? 'rgba(34,197,94,0.25)'
    : p.$type === 'warning'
      ? 'rgba(249,115,22,0.25)'
      : theme.border};
`;

// ─────────────────────────────────────────────
// TRUST NOTE
// ─────────────────────────────────────────────
const TrustNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.15);
  border-radius: 10px;
  font-size: 0.78rem;
  color: ${theme.textMuted};
  line-height: 1.6;
  margin-bottom: 0.5rem;
  animation: ${fadeUp} 0.5s ease 0.35s both;
`;

// ─────────────────────────────────────────────
// ★ PREMIUM COMPACT FOOTER
// ─────────────────────────────────────────────
const ConfirmFooter = styled.div`
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 90;
  background: linear-gradient(180deg, rgba(18,18,18,0.85) 0%, rgba(10,10,10,0.98) 100%);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 -8px 32px rgba(0,0,0,0.4), 0 -1px 0 rgba(249,115,22,0.15);
  padding: 0.875rem 1.5rem; display: flex; justify-content: center;
  @media (max-width: 480px) { padding: 0.75rem 1rem; }
`;

const ConfirmFooterInner = styled.div`
  display: flex; align-items: center; gap: 1.25rem;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 0.75rem 0.875rem 0.75rem 1.25rem;
  width: 100%; max-width: 680px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
  @media (max-width: 600px) {
    flex-direction: column; gap: 0.625rem; padding: 0.875rem 1rem;
    border-radius: 14px; max-width: 100%;
  }
`;

const ConfirmFooterInfo = styled.div`
  flex: 1; min-width: 0;
  @media (max-width: 600px) { width: 100%; text-align: center; }
`;

const ConfirmFooterTitle = styled.div`
  font-size: 0.7rem; font-weight: 600; color: ${theme.textMuted};
  margin-bottom: 0.15rem; text-transform: uppercase; letter-spacing: 0.06em;
`;

const ConfirmFooterId = styled.div`
  font-size: 0.82rem; font-weight: 700; color: ${theme.textPrimary};
  font-family: 'Courier New', monospace; letter-spacing: 0.03em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ConfirmFooterStatus = styled.div`
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.72rem; font-weight: 700; color: ${theme.success}; margin-top: 0.2rem;
  svg { font-size: 0.75rem; }
`;

const ConfirmFooterDivider = styled.div`
  width: 1px; height: 36px; background: rgba(255,255,255,0.08); flex-shrink: 0;
  @media (max-width: 600px) { display: none; }
`;

const ConfirmFooterBtns = styled.div`
  display: flex; gap: 0.625rem; flex-shrink: 0;
  @media (max-width: 600px) { width: 100%; }
`;

const BtnConfirmSecondary = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.8rem 1.25rem; border-radius: 10px;
  border: 1px solid ${theme.border}; background: rgba(255,255,255,0.04);
  color: ${theme.textSecondary}; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
  &:hover {
    background: rgba(255,255,255,0.08);
    border-color: ${theme.textSecondary};
    color: ${theme.textPrimary};
  }
  @media (max-width: 600px) { flex: 1; padding: 0.875rem 1rem; font-size: 0.82rem; }
`;

const BtnConfirmPrimary = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.8rem 1.5rem; border-radius: 10px; border: none;
  background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
  color: white; font-size: 0.9rem; font-weight: 700;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap;
  box-shadow: 0 4px 16px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    transition: left 0.5s ease;
  }
  &:hover::before { left: 100%; }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(249,115,22,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  &:active { transform: translateY(0); }
  @media (max-width: 600px) { flex: 1.5; padding: 0.875rem 1rem; font-size: 0.85rem; }
`;

// ─────────────────────────────────────────────
// LOADING / ERROR
// ─────────────────────────────────────────────
const FullCenter = styled.div`
  min-height: 100vh; background: ${theme.bg}; display: flex; align-items: center;
  justify-content: center; flex-direction: column; gap: 1.25rem; text-align: center; padding: 2rem;
`;

const BigSpinner = styled.div`
  width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.07);
  border-top-color: ${theme.primary}; border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatDate = (val) => {
  if (!val) return 'Not specified';
  try {
    if (typeof val === 'string') return new Date(val).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    if (val.toDate) return val.toDate().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    if (val instanceof Date) return val.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return String(val);
  } catch { return String(val); }
};

const getParticipantCount = (booking) => {
  if (Array.isArray(booking.participants)) return booking.participants.length;
  if (booking.totalParticipants) return Number(booking.totalParticipants);
  if (booking.numberOfParticipants) return Number(booking.numberOfParticipants);
  return 1;
};

const getStatus = (booking) => {
  const s = booking.status?.toLowerCase();
  const p = booking.paymentStatus?.toLowerCase();
  if (s === 'confirmed' || p === 'completed' || p === 'success') return 'success';
  if (s === 'pending' || p === 'pending') return 'warning';
  return 'default';
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        if (!auth.currentUser) {
          setError('Please log in to view booking details.');
          setLoading(false);
          return;
        }
        const data = await BookingService.getBookingById(bookingId);
        let profile = {};
        try {
          const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (snap.exists()) profile = snap.data();
        } catch {}
        const combined = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName,
          ...profile
        };
        setBooking({
          ...data,
          userInfo: combined,
          userName: data.name || data.userName || combined.name || combined.displayName || '',
          userEmail: data.email || data.userEmail || combined.email || '',
          userPhone: data.contactNumber || data.phoneNumber || combined.phone || combined.contactNumber || '',
        });
      } catch (e) {
        console.error(e);
        setError('Could not retrieve booking details. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Trek Booking',
        text: `Booking ID: ${bookingId}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // ── Guards ──
  if (loading) return (
    <FullCenter>
      <BigSpinner />
      <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>Loading your booking…</p>
    </FullCenter>
  );

  if (error || !booking) return (
    <PageWrapper>
      <TopBar>
        <TopBarInner>
          <BackBtn onClick={() => navigate(-1)}><FiArrowLeft size={17} /></BackBtn>
          <TopBarContent>
            <TopBarLabel>Booking</TopBarLabel>
            <TopBarTitle>Not <TopBarTitleAccent>Found</TopBarTitleAccent></TopBarTitle>
          </TopBarContent>
        </TopBarInner>
      </TopBar>
      <FullCenter>
        <FiAlertCircle size={40} color={theme.primary} />
        <h2 style={{ color: theme.textPrimary, fontSize: '1.25rem', fontWeight: 700 }}>
          {error || 'Booking not found'}
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
          We couldn't find booking details for this ID.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <BtnConfirmSecondary onClick={() => navigate('/profile')}>My Profile</BtnConfirmSecondary>
          <BtnConfirmPrimary onClick={() => navigate('/explore')}>Explore Treks</BtnConfirmPrimary>
        </div>
      </FullCenter>
    </PageWrapper>
  );

  // ─────────────────────────────────────────────
  // ★ COMPUTED — Read stored values from BookingPage
  // ─────────────────────────────────────────────
  const participantCount = getParticipantCount(booking);
  const statusType = getStatus(booking);
  const startDate = booking.startDate || booking.trekDate || booking.date;
  const pricePerPerson = booking.pricePerPerson || 0;
  const couponData = booking.coupon || null;
  const discountApplied = booking.discount || booking.discountAmount || 0;

  // ★ FULL trek cost
  const fullTrekCost = (() => {
    if (booking.upfrontAmount && booking.totalAmount && booking.totalAmount > booking.upfrontAmount) {
      return booking.totalAmount;
    }
    if (booking.subtotal) {
      return Math.max(booking.subtotal - discountApplied, 0);
    }
    if (pricePerPerson > 0) {
      return Math.max((pricePerPerson * participantCount) - discountApplied, 0);
    }
    if (booking.totalAmount && !booking.upfrontAmount) {
      return booking.totalAmount;
    }
    return booking.totalAmount || 0;
  })();

  // ★ 20% paid online
  const upfrontPaid = booking.upfrontAmount
    || booking.paidAmount
    || booking.amountPaid
    || Math.ceil(fullTrekCost * 0.20);

  // ★ 80% to organizer
  const remaining = booking.remainingAmount
    || booking.balanceAmount
    || booking.amountDue
    || Math.max(fullTrekCost - upfrontPaid, 0);

  const subtotalAmount = booking.subtotal || (pricePerPerson * participantCount) || fullTrekCost;

  console.log('💰 BookingConfirmation amounts:', {
    fullTrekCost, upfrontPaid, remaining,
    from_db: {
      totalAmount: booking.totalAmount,
      upfrontAmount: booking.upfrontAmount,
      remainingAmount: booking.remainingAmount,
      subtotal: booking.subtotal,
      pricePerPerson: booking.pricePerPerson,
      amount: booking.amount,
    }
  });

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <PageWrapper>

      {/* ★ TOP BAR */}
      <TopBar>
        <TopBarInner>
          <BackBtn onClick={() => navigate(-1)}>
            <FiArrowLeft size={17} />
          </BackBtn>
          <TopBarContent>
            <TopBarLabel>
              <FiCheckCircle size={10} />
              Adventure Confirmed
            </TopBarLabel>
            <TopBarTitle>
              Booking <TopBarTitleAccent>Confirmed!</TopBarTitleAccent>
            </TopBarTitle>
          </TopBarContent>
          <TopBarRight>
            <TopBarBadge>
              <FiShield size={11} />
              <span>Razorpay Secured</span>
            </TopBarBadge>
            <IconBtn onClick={handleShare} title="Share">
              <FiShare2 size={15} />
            </IconBtn>
          </TopBarRight>
        </TopBarInner>
      </TopBar>

      <PageBody>

        {/* Success hero */}
        <SuccessHero>
          <SuccessCircle><FiCheckCircle size={36} /></SuccessCircle>
          <SuccessTitle>Booking Confirmed! 🎉</SuccessTitle>
          <SuccessSubtitle>
            Your adventure is locked in. We've sent a confirmation to{' '}
            {booking.userEmail || 'your email'}.
          </SuccessSubtitle>
          <BookingIdPill>
            <FiFileText size={13} />{booking.id}
          </BookingIdPill>
        </SuccessHero>

        {/* Payment status */}
        <PayStatusBanner>
          <PayStatusItem $success>
            <PayStatusLabel><FiCheckCircle size={11} />Paid Online (20%)</PayStatusLabel>
            <PayStatusValue $success>₹{upfrontPaid.toLocaleString('en-IN')}</PayStatusValue>
            <PayStatusNote>Booking deposit via Razorpay · Confirmed</PayStatusNote>
          </PayStatusItem>
          <PayStatusItem>
            <PayStatusLabel><FiInfo size={11} />Pay to Organizer (80%)</PayStatusLabel>
            <PayStatusValue>₹{remaining.toLocaleString('en-IN')}</PayStatusValue>
            <PayStatusNote>Remaining balance · Due on trek day</PayStatusNote>
          </PayStatusItem>
        </PayStatusBanner>

        {/* Trek details */}
        {booking.trek && (
          <Card $delay="0.1s">
            <CardHead>
              <CardIconWrap><FiMapPin size={16} /></CardIconWrap>
              <CardTitle>Trek Details</CardTitle>
            </CardHead>
            <CardBody>
              {booking.trek.imageUrl && (
                <TrekImageWrap>
                  <TrekImage src={booking.trek.imageUrl} alt={booking.trek.title} />
                  <TrekImageOverlay />
                </TrekImageWrap>
              )}
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>Trek Name</DetailLabel>
                  <DetailValue>{booking.trek.title || booking.trek.name || '—'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Location</DetailLabel>
                  <DetailValue>{booking.trek.location || '—'}</DetailValue>
                </DetailItem>
                {booking.trek.duration && (
                  <DetailItem>
                    <DetailLabel>Duration</DetailLabel>
                    <DetailValue>{booking.trek.duration}</DetailValue>
                  </DetailItem>
                )}
                {booking.trek.difficulty && (
                  <DetailItem>
                    <DetailLabel>Difficulty</DetailLabel>
                    <DetailValue>{booking.trek.difficulty}</DetailValue>
                  </DetailItem>
                )}
              </DetailGrid>
            </CardBody>
          </Card>
        )}

        {/* Booking details */}
        <Card $delay="0.15s">
          <CardHead>
            <CardIconWrap><FiCalendar size={16} /></CardIconWrap>
            <CardTitle>Booking Details</CardTitle>
          </CardHead>
          <CardBody>
            <DetailGrid>
              <DetailItem>
                <DetailLabel>Start Date</DetailLabel>
                <DetailValue>{formatDate(startDate)}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Participants</DetailLabel>
                <DetailValue>{participantCount} person(s)</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Booked On</DetailLabel>
                <DetailValue>{formatDate(booking.createdAt)}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Status</DetailLabel>
                <DetailValue>
                  <StatusBadge $type={statusType}>
                    {statusType === 'success' && <FiCheckCircle size={11} />}
                    {booking.status
                      ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
                      : 'Pending'}
                  </StatusBadge>
                </DetailValue>
              </DetailItem>
            </DetailGrid>
          </CardBody>
        </Card>

        {/* ★ Participants — using our clean styled components */}
        <Card $delay="0.2s">
          <CardHead>
            <CardIconWrap><FiUsers size={16} /></CardIconWrap>
            <CardTitle>Participants ({participantCount})</CardTitle>
          </CardHead>
          <CardBody>
            {Array.isArray(booking.participants) && booking.participants.length > 0 ? (
              <ParticipantGrid>
                {booking.participants.map((p, i) => (
                  <ParticipantCard key={p.participantId || i} $primary={p.isPrimaryBooker}>
                    {p.isPrimaryBooker && <PrimaryBadge>Primary</PrimaryBadge>}
                    <ParticipantNum>Participant {i + 1}</ParticipantNum>
                    <ParticipantName $hasBadge={p.isPrimaryBooker}>
                      {p.name || `Participant ${i + 1}`}
                    </ParticipantName>
                    {p.email && (
                      <ParticipantDetail>
                        <FiUser size={12} />{p.email}
                      </ParticipantDetail>
                    )}
                    {p.age && (
                      <ParticipantDetail>
                        <FiClock size={12} />Age: {p.age}
                      </ParticipantDetail>
                    )}
                    {p.emergencyContact && (
                      <ParticipantDetail>
                        <FiPhone size={12} />Emergency: {p.emergencyContact}
                      </ParticipantDetail>
                    )}
                  </ParticipantCard>
                ))}
              </ParticipantGrid>
            ) : (
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>Participants</DetailLabel>
                  <DetailValue>{participantCount} person(s)</DetailValue>
                </DetailItem>
                {booking.userName && (
                  <DetailItem>
                    <DetailLabel>Primary Booker</DetailLabel>
                    <DetailValue>{booking.userName}</DetailValue>
                  </DetailItem>
                )}
              </DetailGrid>
            )}
          </CardBody>
        </Card>

        {/* ★ Payment breakdown */}
        {fullTrekCost > 0 && (
          <Card $delay="0.25s">
            <CardHead>
              <CardIconWrap><FiCreditCard size={16} /></CardIconWrap>
              <CardTitle>Payment Breakdown</CardTitle>
            </CardHead>
            <CardBody>
              <SplitCard>
                <SplitItem $paid>
                  <SplitPercent $paid>20%</SplitPercent>
                  <SplitLabel>Paid online<br />Booking deposit</SplitLabel>
                  <SplitAmount $paid>₹{upfrontPaid.toLocaleString('en-IN')}</SplitAmount>
                  <SplitStatus $paid>
                    <FiCheckCircle size={10} />Paid via Razorpay
                  </SplitStatus>
                </SplitItem>
                <SplitItem>
                  <SplitPercent>80%</SplitPercent>
                  <SplitLabel>Pay to organizer<br />On trek day</SplitLabel>
                  <SplitAmount>₹{remaining.toLocaleString('en-IN')}</SplitAmount>
                  <SplitStatus>
                    <FiInfo size={10} />Due to organizer
                  </SplitStatus>
                </SplitItem>
              </SplitCard>

              <DetailGrid>
                {pricePerPerson > 0 && (
                  <DetailItem>
                    <DetailLabel>Price per Person</DetailLabel>
                    <DetailValue>₹{pricePerPerson.toLocaleString('en-IN')}</DetailValue>
                  </DetailItem>
                )}
                {participantCount > 1 && subtotalAmount > 0 && (
                  <DetailItem>
                    <DetailLabel>Subtotal ({participantCount} people)</DetailLabel>
                    <DetailValue>₹{subtotalAmount.toLocaleString('en-IN')}</DetailValue>
                  </DetailItem>
                )}
                {discountApplied > 0 && (
                  <DetailItem>
                    <DetailLabel>
                      Discount {couponData?.code ? `(${couponData.code})` : 'Applied'}
                    </DetailLabel>
                    <DetailValue style={{ color: theme.success }}>
                      −₹{discountApplied.toLocaleString('en-IN')}
                    </DetailValue>
                  </DetailItem>
                )}
                <DetailItem>
                  <DetailLabel>Total Trek Cost</DetailLabel>
                  <DetailValue style={{ fontWeight: 700 }}>
                    ₹{fullTrekCost.toLocaleString('en-IN')}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Paid Online (20%)</DetailLabel>
                  <DetailValue style={{ color: theme.success }}>
                    ₹{upfrontPaid.toLocaleString('en-IN')}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Balance to Organizer (80%)</DetailLabel>
                  <DetailValue>₹{remaining.toLocaleString('en-IN')}</DetailValue>
                </DetailItem>
                {(booking.paymentId || booking.transactionId || booking.razorpayPaymentId) && (
                  <DetailItem>
                    <DetailLabel>Payment ID</DetailLabel>
                    <DetailValue style={{ fontSize: '0.8rem', fontFamily: 'Courier New, monospace' }}>
                      {booking.paymentId || booking.transactionId || booking.razorpayPaymentId}
                    </DetailValue>
                  </DetailItem>
                )}
              </DetailGrid>
            </CardBody>
          </Card>
        )}

        {/* Emergency contact */}
        {(booking.emergencyName || booking.emergencyContact || booking.emergencyPhone) && (
          <Card $delay="0.3s">
            <CardHead>
              <CardIconWrap><FiPhone size={16} /></CardIconWrap>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHead>
            <CardBody>
              <DetailGrid>
                {booking.emergencyName && (
                  <DetailItem>
                    <DetailLabel>Name</DetailLabel>
                    <DetailValue>{booking.emergencyName}</DetailValue>
                  </DetailItem>
                )}
                {(booking.emergencyContact || booking.emergencyPhone) && (
                  <DetailItem>
                    <DetailLabel>Contact Number</DetailLabel>
                    <DetailValue>
                      {booking.emergencyContact || booking.emergencyPhone}
                    </DetailValue>
                  </DetailItem>
                )}
              </DetailGrid>
            </CardBody>
          </Card>
        )}

        {/* Special requests */}
        {booking.specialRequests && (
          <Card $delay="0.32s">
            <CardHead>
              <CardIconWrap><FiFileText size={16} /></CardIconWrap>
              <CardTitle>Special Requests</CardTitle>
            </CardHead>
            <CardBody>
              <p style={{
                color: theme.textSecondary,
                fontSize: '0.88rem',
                lineHeight: 1.6,
                margin: 0
              }}>
                {booking.specialRequests}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Trust note */}
        <TrustNote>
          <FiShield
            size={14}
            style={{ color: theme.success, flexShrink: 0, marginTop: '1px' }}
          />
          <span>
            Your 20% deposit (₹{upfrontPaid.toLocaleString('en-IN')}) has been securely
            processed via Razorpay. The remaining 80% (₹{remaining.toLocaleString('en-IN')})
            is payable directly to the trek organizer on your trek day.
            Total trek cost: ₹{fullTrekCost.toLocaleString('en-IN')}.
          </span>
        </TrustNote>

      </PageBody>

      {/* ★ PREMIUM COMPACT FOOTER */}
      <ConfirmFooter>
        <ConfirmFooterInner>
          <ConfirmFooterInfo>
            <ConfirmFooterTitle>Booking Reference</ConfirmFooterTitle>
            <ConfirmFooterId>
              {booking?.id?.length > 22
                ? `${booking.id.substring(0, 22)}…`
                : booking?.id}
            </ConfirmFooterId>
            <ConfirmFooterStatus>
              <FiCheckCircle size={11} /> Confirmed & Paid
            </ConfirmFooterStatus>
          </ConfirmFooterInfo>
          <ConfirmFooterDivider />
          <ConfirmFooterBtns>
            <BtnConfirmSecondary onClick={() => navigate('/profile')}>
              <FiFileText size={14} /> My Bookings
            </BtnConfirmSecondary>
            <BtnConfirmPrimary onClick={() => navigate('/explore')}>
              Explore Treks <FiChevronRight size={15} />
            </BtnConfirmPrimary>
          </ConfirmFooterBtns>
        </ConfirmFooterInner>
      </ConfirmFooter>

    </PageWrapper>
  );
};

export default BookingConfirmation;