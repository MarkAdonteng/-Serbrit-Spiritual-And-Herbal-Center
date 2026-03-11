import { Panel } from '../components/ui'
import { BRAND } from '../lib/constants'

export function AboutPage() {
  return (
    <div className="grid gap-6">
      <div>
        <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">ABOUT</div>
        <h1 className="mt-1 text-3xl font-extrabold">{BRAND.name}</h1>
        <p className="mt-3 max-w-prose text-sm text-white/70">
          Serbrit Spiritual And Herbal Center exists to serve holistic wellness through carefully curated herbal medicine,
          natural remedies, and herbal food products. Our approach is spiritual, natural, clean, and professional.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="p-6">
          <div className="text-sm font-extrabold text-[#c9a227]">Our Story</div>
          <div className="mt-3 grid gap-3 text-sm text-white/70">
            <p>
              Rooted in tradition and guided by modern standards, Serbrit brings together herbal knowledge, spiritual
              balance, and premium quality products.
            </p>
            <p>
              We believe wellness is a journey — supported by nature’s ingredients and a calm, focused lifestyle.
            </p>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="text-sm font-extrabold text-[#c9a227]">Benefits of Herbal Medicine</div>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <div className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1f5f3a]" />
              <span>Supports the body with plant-based nutrients and compounds</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c9a227]" />
              <span>Encourages balance through routines, nourishment, and calm</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white/60" />
              <span>Pairs well with lifestyle practices like rest and hydration</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

