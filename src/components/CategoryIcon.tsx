import React from 'react';
import {
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Car,
  Receipt,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Gift,
  MoreHorizontal,
  Briefcase,
  Award,
  Laptop,
  TrendingUp,
  Coins,
  PlusCircle,
  Banknote,
  Landmark,
  Smartphone,
  ArrowRightLeft,
  DollarSign,
  Tag,
  CircleDollarSign,
  PieChart,
  CreditCard,
  Plane,
  Shirt,
  Film,
  Dumbbell,
  Sparkles,
  BookOpen,
  Baby,
  Activity,
  Target,
  Wrench,
  ShieldAlert,
  PiggyBank,
  ShieldCheck,
  Heart
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  const iconProps = { className, size };

  switch (name) {
    case 'UtensilsCrossed':
      return <UtensilsCrossed {...iconProps} />;
    case 'Coffee':
      return <Coffee {...iconProps} />;
    case 'ShoppingBag':
      return <ShoppingBag {...iconProps} />;
    case 'Car':
      return <Car {...iconProps} />;
    case 'Receipt':
      return <Receipt {...iconProps} />;
    case 'Home':
      return <Home {...iconProps} />;
    case 'Gamepad2':
      return <Gamepad2 {...iconProps} />;
    case 'HeartPulse':
      return <HeartPulse {...iconProps} />;
    case 'GraduationCap':
      return <GraduationCap {...iconProps} />;
    case 'Gift':
      return <Gift {...iconProps} />;
    case 'Briefcase':
      return <Briefcase {...iconProps} />;
    case 'Award':
      return <Award {...iconProps} />;
    case 'Laptop':
      return <Laptop {...iconProps} />;
    case 'TrendingUp':
      return <TrendingUp {...iconProps} />;
    case 'Coins':
      return <Coins {...iconProps} />;
    case 'PlusCircle':
      return <PlusCircle {...iconProps} />;
    case 'Banknote':
      return <Banknote {...iconProps} />;
    case 'Landmark':
      return <Landmark {...iconProps} />;
    case 'Smartphone':
      return <Smartphone {...iconProps} />;
    case 'ArrowRightLeft':
      return <ArrowRightLeft {...iconProps} />;
    case 'DollarSign':
      return <DollarSign {...iconProps} />;
    case 'CircleDollarSign':
      return <CircleDollarSign {...iconProps} />;
    case 'PieChart':
      return <PieChart {...iconProps} />;
    case 'CreditCard':
      return <CreditCard {...iconProps} />;
    case 'Plane':
      return <Plane {...iconProps} />;
    case 'Shirt':
      return <Shirt {...iconProps} />;
    case 'Film':
      return <Film {...iconProps} />;
    case 'Dumbbell':
      return <Dumbbell {...iconProps} />;
    case 'Sparkles':
      return <Sparkles {...iconProps} />;
    case 'BookOpen':
      return <BookOpen {...iconProps} />;
    case 'Baby':
      return <Baby {...iconProps} />;
    case 'Activity':
      return <Activity {...iconProps} />;
    case 'Target':
      return <Target {...iconProps} />;
    case 'PiggyBank':
      return <PiggyBank {...iconProps} />;
    case 'ShieldCheck':
      return <ShieldCheck {...iconProps} />;
    case 'Heart':
      return <Heart {...iconProps} />;
    case 'Wrench':
      return <Wrench {...iconProps} />;
    case 'ShieldAlert':
      return <ShieldAlert {...iconProps} />;
    case 'Tag':
    default:
      return <MoreHorizontal {...iconProps} />;
  }
};
