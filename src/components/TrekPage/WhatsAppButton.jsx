import styled from "styled-components";
import { FaWhatsapp } from "react-icons/fa";

const tokens = {
  transition: { spring: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" },
};

const FloatingWA = styled.a`
  position: fixed;
  bottom: 1rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #25d366;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.625rem;
  text-decoration: none;
  z-index: 90;
  box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
  transition: ${tokens.transition.spring};

  &:hover {
    transform: scale(1.12);
    box-shadow: 0 12px 32px rgba(37, 211, 102, 0.6);
  }

  @media (max-width: 640px) {
    bottom: 5rem;
    right: 1.25rem;
    width: 50px;
    height: 50px;
    font-size: 1.375rem;
  }
`;

export default function WhatsAppButton({ href, title = "Chat on WhatsApp" }) {
  return (
    <FloatingWA href={href} target="_blank" rel="noopener noreferrer" title={title}>
      <FaWhatsapp />
    </FloatingWA>
  );
}