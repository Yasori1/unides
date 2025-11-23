import React, { useState } from 'react';
import { motion } from 'framer-motion';

// --- Next.js Bileşenleri için Yerel Versiyonlar (Angular'da çalışması için) ---
const Link = ({ href, children, className, ...rest }: any) => {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
};

const Image = ({ src, alt, width, height, className }: any) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
};
// ---------------------------------------------------------------------------

// DÜZELTME: "as const" ekleyerek TypeScript hatası giderildi.
const transition = {
  type: 'spring',
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
} as const;

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
}) => {
  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.p
        transition={{ duration: 0.3 }}
        className="cursor-pointer text-black hover:opacity-[0.9] dark:text-white m-0 font-medium text-[15px]"
      >
        {item}
      </motion.p>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className="absolute top-[calc(100%_+_1.2rem)] left-1/2 transform -translate-x-1/2 pt-4 z-50">
              <motion.div
                transition={transition}
                layoutId="active"
                className="bg-white dark:bg-black backdrop-blur-sm rounded-2xl overflow-hidden border border-black/[0.2] dark:border-white/[0.2] shadow-xl"
              >
                <motion.div layout className="w-max h-full p-4">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)}
      className="relative rounded-full border border-transparent dark:bg-black dark:border-white/[0.2] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex justify-center space-x-8 px-10 py-4"
      style={{ border: '1px solid rgba(0,0,0,0.05)' }}
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <Link href={href} className="flex space-x-4 no-underline group">
      <Image
        src={src}
        width={140}
        height={70}
        alt={title}
        className="flex-shrink-0 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-200"
      />
      <div>
        <h4 className="text-base font-bold mb-1 text-black dark:text-white group-hover:text-indigo-600 transition-colors">
          {title}
        </h4>
        <p className="text-neutral-500 text-sm max-w-[10rem] dark:text-neutral-300 m-0 leading-snug">
          {description}
        </p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({ children, ...rest }: any) => {
  return (
    <Link
      {...rest}
      className="text-neutral-600 dark:text-neutral-200 hover:text-black block py-1 no-underline text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
};

export function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className={`fixed top-5 inset-x-0 max-w-2xl mx-auto z-50 ${className}`}>
      <Menu setActive={setActive}>
        <div className="flex items-center justify-center">
          <Link href="/" className="no-underline text-black hover:opacity-90 mr-4">
            Ana Sayfa
          </Link>
        </div>

        <MenuItem setActive={setActive} active={active} item="Sayfalar">
          <div className="text-sm grid grid-cols-2 gap-5 p-4 bg-white rounded-xl w-[500px]">
            <ProductItem
              title="Topluluklar"
              href="/communities"
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=140&q=80"
              description="Kulüpleri keşfet ve katıl."
            />
            <ProductItem
              title="Etkinlikler"
              href="/events"
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=140&q=80"
              description="Kampüs etkinliklerini kaçırma."
            />
            <ProductItem
              title="Duyurular"
              href="/announcements"
              src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=140&q=80"
              description="Güncel haberler burada."
            />
            <ProductItem
              title="Fırsatlar"
              href="/opportunities"
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=140&q=80"
              description="Staj ve kariyer imkanları."
            />
          </div>
        </MenuItem>

        <MenuItem setActive={setActive} active={active} item="Kurumsal">
          <div className="flex flex-col space-y-2 text-sm w-[200px] p-2">
            <HoveredLink href="/about">Hakkımızda</HoveredLink>
            <HoveredLink href="/contact">İletişim</HoveredLink>
            <HoveredLink href="/corporate-login">Kurumsal Giriş</HoveredLink>
          </div>
        </MenuItem>

        <MenuItem setActive={setActive} active={active} item="Bilgi">
          <div className="flex flex-col space-y-2 text-sm w-[200px] p-2">
            <HoveredLink href="/faq">Sıkça Sorulan Sorular</HoveredLink>
            <HoveredLink href="/privacy-policy">Gizlilik Politikası</HoveredLink>
            <HoveredLink href="/terms-conditions">Kullanım Şartları</HoveredLink>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}
