import { motion } from "framer-motion";

const variants = {
  initial: { opacity: 0, x: 50 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -50 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      className="w-full h-full"
      variants={variants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
