import React from 'react';
import {
  Users,
  Plus,
  Check,
  X,
  Shield,
  Crown,
  Settings,
  Ban,
  UserMinus,
  AlertCircle,
  Heart as LucideHeart,
  MessageCircle,
  Flag,
} from 'lucide-react';

export { Users, Plus, Check, X, Shield, Crown, Settings, Ban, UserMinus, AlertCircle, MessageCircle, Flag };

export const Heart = ({ className, filled = false }) => (
  <LucideHeart className={`${className}${filled ? ' fill-current' : ''}`} />
);
