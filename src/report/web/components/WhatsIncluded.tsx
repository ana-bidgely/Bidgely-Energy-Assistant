import type { WhatsIncludedSection, IncludedCard } from '../../types';
import { LeafIcon, PriceTagIcon, BarIncreaseIcon } from './icons/OptimizerIcons';

interface Props {
  section: WhatsIncludedSection;
}

const ICON: Record<IncludedCard['icon'], typeof LeafIcon> = {
  leaf: LeafIcon,
  'price-tag': PriceTagIcon,
  'bar-chart': BarIncreaseIcon,
};

// WhatsIncluded — "What's Included in This Report" card (Home Optimizer
// report): a headline + two side-by-side cards, each with an icon, a short
// description, and a "Potential savings" line under a divider.
export function WhatsIncluded({ section }: Props) {
  return (
    <div className="bg-white border border-[#F7F7F7] rounded-[14px] p-8 flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] leading-[28px] font-bold text-[#000000] m-0">{section.title}</h2>
        <p className="text-[14px] leading-[20px] text-[#262E40] m-0 whitespace-pre-line">{section.description}</p>
      </div>
      <div className="flex gap-3">
        {section.cards.map((card) => {
          const Icon = ICON[card.icon];
          return (
          <div key={card.title} className="flex-1 min-w-0 bg-white border border-[#F7F7F7] rounded-[14px] px-4 pt-6 pb-8 flex flex-col gap-4">
            <Icon className="w-8 h-8" />
            <h3 className="text-[18px] leading-[26px] font-semibold text-[#000000] m-0">{card.title}</h3>
            <p className="text-[14px] leading-[20px] text-[#000000] m-0">{card.description}</p>
            <div className="h-px bg-[#EFEFEF] w-full" />
            <div className="flex flex-col">
              <span className="text-[12px] leading-[16px] text-[#14843C]">{card.savingsLabel}</span>
              <span className="text-[16px] leading-[24px] font-semibold text-[#14843C]">{card.savingsAmount}</span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
