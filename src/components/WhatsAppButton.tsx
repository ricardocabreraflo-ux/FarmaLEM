import { site } from "@/lib/site";

export function WhatsAppButton() {
  return (
    <a
      href={site.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="motion-safe:animate-wa-pulse fixed bottom-[22px] right-[22px] z-50 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-turquoise text-[#06322F] shadow-[0_14px_30px_-8px_rgb(46_179_172_/_0.6)] transition-transform duration-150 ease-out hover:scale-[1.08] active:scale-[0.94]"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[27px] w-[27px]">
        <path d="M12 2C6.5 2 2 6.4 2 11.9c0 1.9.5 3.7 1.5 5.3L2 22l4.9-1.5c1.5.9 3.3 1.4 5.1 1.4 5.5 0 10-4.4 10-9.9C22 6.4 17.5 2 12 2Zm0 18c-1.6 0-3.1-.4-4.4-1.3l-.3-.2-2.9.9.9-2.8-.2-.3C4.4 15 4 13.4 4 11.9 4 7.5 7.6 4 12 4s8 3.5 8 7.9-3.6 8.1-8 8.1Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" />
      </svg>
    </a>
  );
}
