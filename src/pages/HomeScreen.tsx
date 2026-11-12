import { motion, type Variants } from "motion/react"
import { BookOpen, Library, FilePlus } from "lucide-react"

import Logo from "../static/img/logo-light.png"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
}

const FEATURES = [
  {
    icon: Library,
    title: "Escolha uma pasta",
    text: "Abra uma pasta da biblioteca para ver as HQs que estão nela.",
  },
  {
    icon: FilePlus,
    title: "Adicione HQs",
    text: "Envie arquivos PDF, CBZ ou CBR direto pelo site para a pasta aberta.",
  },
  {
    icon: BookOpen,
    title: "Leia do seu jeito",
    text: "Vire páginas com efeito de folha, use zoom e continue de onde parou.",
  },
]

function HomeScreen() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto py-4 md:py-10 flex flex-col gap-8 md:gap-12"
    >
      <motion.div
        variants={item}
        className="flex flex-col items-center text-center gap-4"
      >
        <div className="relative w-28 h-28 flex items-center justify-center">
          <motion.div
            className="absolute inset-4 rounded-full bg-cv-accent blur-2xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-20 h-20 rounded-2xl bg-cv-card-hover border border-cv-border flex items-center justify-center text-cv-accent shadow-xl"
          >
            <img className="w-10 h-10" src={Logo} alt="ComicVault" />
          </motion.div>

          <motion.span
            className="absolute top-1 right-1 text-cv-accent"
            animate={{ scale: [0.6, 1.1, 0.6], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BookOpen size={20} />
          </motion.span>
          <motion.span
            className="absolute bottom-2 left-0 text-cv-accent"
            animate={{ scale: [0.5, 1, 0.5], opacity: [0.2, 0.9, 0.2] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2,
            }}
          >
            <BookOpen size={14} />
          </motion.span>
        </div>

        <h1
          className="text-cv-accent text-3xl md:text-4xl font-bold"
          style={{ fontFamily: "Titulo" }}
        >
          Bem-vindo ao ComicVault
        </h1>
        <p className="text-cv-text-muted text-sm md:text-base max-w-md">
          Sua biblioteca de HQs em um só lugar. Escolha uma pasta para começar a
          ler.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
      >
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <motion.div
            key={title}
            variants={item}
            whileHover={{ y: -4 }}
            className="bg-cv-card-hover border border-cv-border rounded-xl p-4 flex flex-col gap-3"
          >
            <motion.div
              whileHover={{ rotate: -8, scale: 1.1 }}
              className="w-10 h-10 rounded-lg bg-[var(--cv-accent-muted)] text-cv-accent flex items-center justify-center"
            >
              <Icon size={20} />
            </motion.div>
            <div>
              <p className="text-cv-text text-sm font-semibold">{title}</p>
              <p className="text-cv-text-muted text-xs md:text-sm mt-1">
                {text}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

export default HomeScreen
