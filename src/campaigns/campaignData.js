/**
 * HIGHVERZ — Campaign Analysis Data
 * Curated marketing breakdowns for select movies.
 * Completely separated from TMDB metadata.
 * Keyed by TMDB movie ID.
 */

const campaignAnalyses = {
  // ─── OPPENHEIMER (2023) ───
  872585: {
    tmdbId: 872585,
    campaignSummary: "Universal Pictures orchestrated a masterclass in event-cinema marketing. The campaign transformed a 3-hour historical drama about nuclear physics into the biggest cultural event of 2023, leveraging Christopher Nolan's auteur brand, IMAX exclusivity, and the organic phenomenon of 'Barbenheimer' to create unprecedented demand.",
    campaignGoal: "Position a dense historical drama as must-see theatrical event cinema and drive massive opening weekend box office.",
    targetAudience: "Cinephiles, Nolan loyalists, history enthusiasts, 25–54 adults, prestige film audiences",
    campaignDuration: "8 Months",
    platforms: ["YouTube", "Instagram", "X", "TikTok", "IMAX", "PR"],
    promotionStrategies: [
      {
        icon: "🎬",
        title: "Trailer Strategy",
        description: "Two meticulously crafted trailers that revealed almost nothing — building mystery and intrigue. The teaser alone generated 100M+ views, using Ludwig Göransson's haunting score as an emotional hook. Each trailer was an event in itself."
      },
      {
        icon: "📱",
        title: "Social Media Strategy",
        description: "Controlled information release strategy. Every character poster, every behind-the-scenes still was treated as a cultural artifact. The cast's social media presence amplified organic reach without over-saturating the audience."
      },
      {
        icon: "🔥",
        title: "Cultural Marketing",
        description: "The 'Barbenheimer' meme became the most powerful organic marketing force of 2023. Instead of fighting it, Universal leaned into the cultural moment — turning a scheduling collision into a historic double-feature phenomenon."
      },
      {
        icon: "🤝",
        title: "Influencer Strategy",
        description: "Exclusive IMAX preview screenings for film critics, creators, and cultural commentators. The reactions became content — authentic, emotional testimonials that couldn't be manufactured."
      },
      {
        icon: "📰",
        title: "PR & Media",
        description: "Nolan's interviews became media events. His stance on practical effects, IMAX filmmaking, and the importance of theatrical cinema generated hundreds of editorial pieces that positioned the film as culturally significant."
      },
      {
        icon: "📣",
        title: "Paid Distribution",
        description: "Heavy investment in IMAX partnerships, premium format exclusivity, and wide theatrical placement. The '70mm IMAX' became a status symbol for audiences — creating demand through scarcity."
      }
    ],
    platformBreakdown: [
      {
        platform: "YouTube",
        strategy: "Build anticipation through cinematic trailers and controlled behind-the-scenes content.",
        contentTypes: ["Official Trailers", "Character Featurettes", "Director Interviews", "IMAX Behind The Scenes"]
      },
      {
        platform: "Instagram",
        strategy: "Visual storytelling through character posters, set photography, and cast-driven content.",
        contentTypes: ["Character Posters", "Set Photography", "Cast Stories", "Premiere Coverage"]
      },
      {
        platform: "TikTok",
        strategy: "Leverage organic fan content and the Barbenheimer phenomenon.",
        contentTypes: ["Fan Reactions", "Barbenheimer Content", "Historical Facts", "Meme Culture"]
      },
      {
        platform: "X",
        strategy: "Real-time conversation driver. Premiere reactions, critic quotes, and audience discourse.",
        contentTypes: ["Premiere Reactions", "Critic Quotes", "Fan Discussions", "Cultural Commentary"]
      },
      {
        platform: "PR",
        strategy: "Position Nolan as the voice of theatrical cinema. Every interview reinforced the 'event cinema' narrative.",
        contentTypes: ["Director Profiles", "Cover Stories", "Festival Coverage", "Award Season Press"]
      }
    ],
    contentEngine: [
      { type: "TEASER", label: "Mystery Teaser" },
      { type: "TRAILER", label: "Official Trailers" },
      { type: "SHORT CLIPS", label: "Character Featurettes" },
      { type: "CULTURAL MOMENT", label: "Barbenheimer" },
      { type: "CREATOR CONTENT", label: "Film Critic Reactions" },
      { type: "PRESS", label: "Nolan Interviews" },
      { type: "FAN CONTENT", label: "IMAX Experiences" }
    ],
    timeline: [
      { phase: "T-8 MONTHS", title: "Teaser Announcement", description: "First teaser trailer drops — pure mystery and intrigue" },
      { phase: "T-5 MONTHS", title: "Full Trailer", description: "Official trailer reveals scope — 100M+ views in 48 hours" },
      { phase: "T-3 MONTHS", title: "Cast Campaign", description: "Character posters and cast interviews roll out" },
      { phase: "T-2 MONTHS", title: "Barbenheimer Ignites", description: "Organic meme phenomenon begins building cultural momentum" },
      { phase: "T-1 MONTH", title: "Critic Previews", description: "Exclusive IMAX screenings generate overwhelming buzz" },
      { phase: "RELEASE WEEK", title: "Cultural Event", description: "Biggest non-franchise opening of the decade — $180M global" },
      { phase: "POST RELEASE", title: "Awards Momentum", description: "Sustained conversation drives legs — 7 Academy Awards" }
    ],
    estimatedBudget: {
      total: "$100M – $150M",
      label: "Industry Estimate",
      breakdown: [
        { category: "Media Buying", percentage: 35 },
        { category: "Digital Distribution", percentage: 25 },
        { category: "PR & Publicity", percentage: 15 },
        { category: "IMAX / Premium Formats", percentage: 15 },
        { category: "Experiential & Events", percentage: 10 }
      ]
    },
    whyItWorked: [
      { number: "01", title: "Created Scarcity Through Format", description: "70mm IMAX became a badge of honor — audiences felt they had to see it in the 'right' format." },
      { number: "02", title: "Embraced The Organic Moment", description: "Barbenheimer wasn't planned, but Universal rode the wave instead of fighting it." },
      { number: "03", title: "Director As Brand", description: "Nolan's personal brand was the campaign — his name alone drove ticket sales." },
      { number: "04", title: "Revealed Nothing, Promised Everything", description: "Trailers built mystery. Audiences bought tickets to experience the unknown." },
      { number: "05", title: "Turned Cinema Into An Event", description: "Going to see Oppenheimer wasn't just watching a movie — it was participating in culture." }
    ],
    highverzTakeaways: [
      { pillar: "CONTENT", insight: "Create assets so compelling they become the conversation — not just a promotion for it." },
      { pillar: "DISTRIBUTION", insight: "Format scarcity (IMAX, 70mm) created urgency. Not all platforms are equal — lean into what makes your content special." },
      { pillar: "CULTURE", insight: "The best campaigns don't fight organic moments — they amplify them. Barbenheimer was a gift." },
      { pillar: "GROWTH", insight: "When audiences become evangelists, your reach multiplies exponentially. Give them something worth sharing." }
    ]
  },

  // ─── BARBIE (2023) ───
  346698: {
    tmdbId: 346698,
    campaignSummary: "Warner Bros. and Mattel executed arguably the most ambitious brand campaign in film history. The Barbie movie marketing didn't just promote a film — it turned an entire cultural moment pink. From the Malibu DreamHouse on Airbnb to Barbie-branded everything, this was a 360° lifestyle takeover that blurred the line between marketing and culture.",
    campaignGoal: "Transform a legacy toy brand into a cultural phenomenon and drive the biggest comedy opening of the decade.",
    targetAudience: "Gen Z women, Millennials, nostalgic adults, fashion-forward audiences, pop culture enthusiasts",
    campaignDuration: "10 Months",
    platforms: ["Instagram", "TikTok", "YouTube", "X", "Meta", "Experiential"],
    promotionStrategies: [
      {
        icon: "🎬",
        title: "Trailer Strategy",
        description: "Trailers were mini-movies in themselves — each revealing layers of self-aware humor while keeping the deeper themes hidden. The first trailer's 2001: A Space Odyssey homage signaled: this isn't what you expect."
      },
      {
        icon: "📱",
        title: "Social Media Strategy",
        description: "The Barbie Selfie Generator became the most viral branded tool of 2023. User-generated 'This Barbie is...' memes flooded every platform. Warner Bros. created the template; the internet did the rest."
      },
      {
        icon: "🔥",
        title: "Cultural Marketing",
        description: "Barbie didn't just market a movie — it created a movement. 'Barbiecore' pink fashion trends, brand collaborations with 100+ partners, and the Barbie DreamHouse on Airbnb made Barbie inescapable."
      },
      {
        icon: "🤝",
        title: "Influencer Strategy",
        description: "Margot Robbie's press tour became a masterclass in character-driven fashion marketing. Every outfit referenced a classic Barbie look, generating daily viral moments and editorial coverage."
      },
      {
        icon: "📰",
        title: "PR & Media",
        description: "Greta Gerwig's feminist reinterpretation of Barbie generated serious cultural discourse, elevating the film beyond entertainment into a social commentary event."
      },
      {
        icon: "📣",
        title: "Paid Distribution",
        description: "Massive cross-platform paid campaigns complemented by 100+ brand partnerships. Every brand wanted to be pink — creating an unprecedented earned media multiplier."
      }
    ],
    platformBreakdown: [
      {
        platform: "Instagram",
        strategy: "Visual-first platform takeover. Barbie Selfie Generator + Margot Robbie's fashion press tour content.",
        contentTypes: ["Barbie Selfie Generator", "Press Tour Fashion", "Behind The Scenes", "Brand Collaborations"]
      },
      {
        platform: "TikTok",
        strategy: "Creator-driven organic explosion. Sound trends, outfit recreations, and 'This Barbie is...' UGC.",
        contentTypes: ["Barbie Sound Trends", "Outfit Recreations", "Memes", "Creator Reactions"]
      },
      {
        platform: "YouTube",
        strategy: "Long-form trailer drops and behind-the-scenes documentary content.",
        contentTypes: ["Official Trailers", "Featurettes", "Music Videos", "Cast Interviews"]
      },
      {
        platform: "X",
        strategy: "Real-time conversation and meme amplification. Barbenheimer discourse.",
        contentTypes: ["Meme Engagement", "Cultural Commentary", "Premiere Coverage", "Fan Art Shares"]
      },
      {
        platform: "Meta",
        strategy: "Broad reach paid campaigns targeting nostalgic Millennial demographics.",
        contentTypes: ["Targeted Ads", "Event Promotions", "Community Groups", "Nostalgia Content"]
      }
    ],
    contentEngine: [
      { type: "TRAILER", label: "Cinematic Trailers" },
      { type: "UGC TOOL", label: "Barbie Selfie Generator" },
      { type: "FASHION", label: "Press Tour Looks" },
      { type: "MEMES", label: "This Barbie Is..." },
      { type: "BRAND COLLABS", label: "100+ Partnerships" },
      { type: "CREATOR CONTENT", label: "TikTok Explosion" },
      { type: "FAN CONTENT", label: "Barbiecore Movement" }
    ],
    timeline: [
      { phase: "T-10 MONTHS", title: "First Look", description: "Margot Robbie in the pink Corvette — image breaks the internet" },
      { phase: "T-7 MONTHS", title: "Teaser Trailer", description: "2001 Space Odyssey homage signals this is not a kids' movie" },
      { phase: "T-5 MONTHS", title: "Selfie Generator Launch", description: "Branded UGC tool goes mega-viral across all platforms" },
      { phase: "T-3 MONTHS", title: "Brand Partnership Wave", description: "100+ brands go pink — Barbiecore becomes a lifestyle trend" },
      { phase: "T-1 MONTH", title: "Press Tour Domination", description: "Margot's fashion tour generates daily viral moments" },
      { phase: "RELEASE WEEK", title: "Barbenheimer Explosion", description: "$162M domestic opening — biggest comedy opening ever" },
      { phase: "POST RELEASE", title: "Cultural Legacy", description: "$1.4B worldwide — becomes highest-grossing film by a female director" }
    ],
    estimatedBudget: {
      total: "$140M – $180M",
      label: "Industry Estimate",
      breakdown: [
        { category: "Brand Partnerships", percentage: 30 },
        { category: "Digital Distribution", percentage: 25 },
        { category: "Media Buying", percentage: 20 },
        { category: "Experiential", percentage: 15 },
        { category: "PR & Publicity", percentage: 10 }
      ]
    },
    whyItWorked: [
      { number: "01", title: "Made Marketing The Product", description: "The marketing campaign was as entertaining as the movie itself." },
      { number: "02", title: "Gave Audiences The Tools", description: "The Barbie Selfie Generator let everyone participate in the campaign." },
      { number: "03", title: "100+ Brand Partners Created Ubiquity", description: "Barbie wasn't just a movie — it was everywhere you looked." },
      { number: "04", title: "Fashion As Marketing", description: "Margot Robbie's press tour turned fashion into the most effective campaign channel." },
      { number: "05", title: "Subverted Expectations", description: "The 'this isn't what you think' positioning intrigued skeptics and turned them into advocates." }
    ],
    highverzTakeaways: [
      { pillar: "CONTENT", insight: "Your marketing content should be as shareable as your product. The Barbie Selfie Generator proved UGC tools are the ultimate distribution hack." },
      { pillar: "DISTRIBUTION", insight: "When 100 brands are doing your marketing for you, you've won. Partnerships are distribution channels." },
      { pillar: "CULTURE", insight: "Don't just enter the conversation — become the conversation. Barbiecore wasn't a hashtag, it was a movement." },
      { pillar: "GROWTH", insight: "Give people the tools to express themselves through your brand, and they'll do your marketing at scale." }
    ]
  },

  // ─── DUNE: PART TWO (2024) ───
  693134: {
    tmdbId: 693134,
    campaignSummary: "Warner Bros. and Legendary crafted a campaign that honored the epic scope of Denis Villeneuve's vision. Building on the foundation of Part One's loyal fanbase, the campaign emphasized spectacle, IMAX filmmaking, and the film's position as the definitive sci-fi epic of the decade. Every asset communicated scale.",
    campaignGoal: "Deliver the biggest opening for a Denis Villeneuve film and establish Dune as a franchise powerhouse.",
    targetAudience: "Sci-fi enthusiasts, Part One fans, IMAX audiences, 18-45 demographic, book readers",
    campaignDuration: "6 Months",
    platforms: ["YouTube", "Instagram", "IMAX", "X", "TikTok", "PR"],
    promotionStrategies: [
      {
        icon: "🎬",
        title: "Trailer Strategy",
        description: "Trailers focused on pure spectacle and scale — sandworm riding, desert warfare, and Zimmer's thunderous score. Every frame screamed 'see this on the biggest screen possible.'"
      },
      {
        icon: "📱",
        title: "Social Media Strategy",
        description: "Visually-driven campaign leveraging the film's stunning production design. Character reveals and behind-the-scenes VFX breakdowns created a sense of cinematic craftsmanship."
      },
      {
        icon: "🔥",
        title: "Cultural Marketing",
        description: "Positioned as the 'Lord of the Rings of our generation' — tapping into cultural desire for epic, world-building cinema. Fan communities became amplification engines."
      },
      {
        icon: "🤝",
        title: "Influencer Strategy",
        description: "Film critics and sci-fi creators received early screenings, generating overwhelming positive word-of-mouth. Timothée Chalamet and Zendaya's star power drove mainstream awareness."
      },
      {
        icon: "📰",
        title: "PR & Media",
        description: "Villeneuve's interviews positioned the film as a singular artistic vision. Coverage focused on practical effects, IMAX cameras, and the director's uncompromising creative process."
      },
      {
        icon: "📣",
        title: "Paid Distribution",
        description: "Strategic premium format partnerships with IMAX and Dolby. The 'experience' positioning justified premium ticket prices and drove repeat viewings."
      }
    ],
    platformBreakdown: [
      {
        platform: "YouTube",
        strategy: "Epic trailer content and VFX behind-the-scenes breakdowns to satisfy the core fanbase.",
        contentTypes: ["Official Trailers", "VFX Breakdowns", "Director Commentary", "Cast Interviews"]
      },
      {
        platform: "Instagram",
        strategy: "High-production stills and character portraits that showcase the film's visual grandeur.",
        contentTypes: ["Character Posters", "Production Stills", "BTS Photography", "Premiere Coverage"]
      },
      {
        platform: "TikTok",
        strategy: "Shorter format clips, sound bites from the score, and fan community engagement.",
        contentTypes: ["Score Snippets", "Fan Theories", "Cast Moments", "Visual Clips"]
      },
      {
        platform: "X",
        strategy: "Critic reactions, fan discourse, and real-time premiere coverage.",
        contentTypes: ["Premiere Reactions", "Critic Reviews", "Fan Art", "Spoiler Discussions"]
      },
      {
        platform: "IMAX",
        strategy: "Premium format exclusivity as a distribution and marketing channel.",
        contentTypes: ["IMAX Featurettes", "Format Comparison", "Theater Experience", "Director IMAX Message"]
      }
    ],
    contentEngine: [
      { type: "TRAILER", label: "Spectacle Trailers" },
      { type: "FEATURETTES", label: "VFX Breakdowns" },
      { type: "SHORT CLIPS", label: "Scene Previews" },
      { type: "CREATOR CONTENT", label: "Critic Reactions" },
      { type: "PRESS", label: "Villeneuve Interviews" },
      { type: "FAN CONTENT", label: "Community Theories" }
    ],
    timeline: [
      { phase: "T-6 MONTHS", title: "Official Trailer", description: "First full trailer — sandworm riding sequence breaks the internet" },
      { phase: "T-4 MONTHS", title: "IMAX Announcement", description: "Premium format exclusivity window creates urgency" },
      { phase: "T-2 MONTHS", title: "Character Campaign", description: "New cast member reveals and character-focused content" },
      { phase: "T-1 MONTH", title: "Critic Screenings", description: "Overwhelming positive reception — 'best sci-fi sequel ever' narrative" },
      { phase: "RELEASE WEEK", title: "Box Office Domination", description: "$178M global opening — franchise established" },
      { phase: "POST RELEASE", title: "Sustained Legs", description: "Strong word-of-mouth drives repeat viewings and $714M worldwide" }
    ],
    estimatedBudget: {
      total: "$100M – $130M",
      label: "Industry Estimate",
      breakdown: [
        { category: "Media Buying", percentage: 35 },
        { category: "Digital Distribution", percentage: 25 },
        { category: "IMAX / Premium Formats", percentage: 15 },
        { category: "PR & Publicity", percentage: 15 },
        { category: "Experiential & Events", percentage: 10 }
      ]
    },
    whyItWorked: [
      { number: "01", title: "Built On Part One's Foundation", description: "A loyal fanbase was already primed — the campaign activated them as evangelists." },
      { number: "02", title: "Sold The Experience, Not The Plot", description: "Marketing focused on spectacle and scale, not story beats." },
      { number: "03", title: "Star Power Amplified Reach", description: "Chalamet and Zendaya brought mainstream audiences to a sci-fi epic." },
      { number: "04", title: "Premium Positioning Created Value", description: "IMAX exclusivity made the theatrical experience feel unmissable." }
    ],
    highverzTakeaways: [
      { pillar: "CONTENT", insight: "When your product is visually stunning, let the content speak for itself. Every frame was a poster." },
      { pillar: "DISTRIBUTION", insight: "Premium format partnerships aren't just distribution — they're marketing channels that create urgency." },
      { pillar: "CULTURE", insight: "Position your work within a larger cultural narrative. 'The sci-fi epic of our generation' is a story worth sharing." },
      { pillar: "GROWTH", insight: "Build on existing communities. Activate fans, don't try to create them from scratch." }
    ]
  },

  // ─── SPIDER-MAN: ACROSS THE SPIDER-VERSE (2023) ───
  569094: {
    tmdbId: 569094,
    campaignSummary: "Sony Pictures Animation and Columbia Pictures built one of the most artistically driven campaigns in blockbuster history. The campaign used the film's revolutionary animation styles as the core marketing asset — every frame was so visually distinctive that it became instantly shareable content.",
    campaignGoal: "Surpass the original Spider-Verse's box office and cultural impact, establishing it as the definitive animated franchise.",
    targetAudience: "Animation fans, comic book audiences, Gen Z, families, art and design communities",
    campaignDuration: "6 Months",
    platforms: ["YouTube", "Instagram", "TikTok", "X", "Meta", "PR"],
    promotionStrategies: [
      {
        icon: "🎬",
        title: "Trailer Strategy",
        description: "Each trailer showcased a different animation style and universe — making audiences feel they were seeing something that had never been done before. The visual ambition was the hook."
      },
      {
        icon: "📱",
        title: "Social Media Strategy",
        description: "Frame-by-frame breakdowns, artist spotlights, and animation style reveals turned the art community into the campaign's biggest amplifiers."
      },
      {
        icon: "🔥",
        title: "Cultural Marketing",
        description: "The 'every frame is a painting' narrative positioned Spider-Verse as high art — transcending the 'animated movie' label. Art communities, designers, and illustrators became organic evangelists."
      },
      {
        icon: "🤝",
        title: "Influencer Strategy",
        description: "Artist and animator creators received exclusive content to break down — turning technical craft into viral content. Fan artists created alternate universe Spider-People."
      },
      {
        icon: "📰",
        title: "PR & Media",
        description: "Deep-dive features on the animation process, featuring the 1000+ artists who worked on the film. The narrative: this team is pushing the boundaries of what animation can be."
      },
      {
        icon: "📣",
        title: "Paid Distribution",
        description: "Wide theatrical release with emphasis on premium visual and audio formats. Cross-promotional partnerships with gaming and streetwear brands."
      }
    ],
    platformBreakdown: [
      {
        platform: "YouTube",
        strategy: "Visually spectacular trailers and behind-the-scenes animation process content.",
        contentTypes: ["Official Trailers", "Animation Breakdowns", "Artist Interviews", "Scene Previews"]
      },
      {
        platform: "Instagram",
        strategy: "Frame-by-frame art breakdowns and artist spotlights.",
        contentTypes: ["Frame Art", "Artist Spotlights", "Style Comparisons", "Fan Art Reposts"]
      },
      {
        platform: "TikTok",
        strategy: "Short-form animation style reveals and fan theory content.",
        contentTypes: ["Style Reveals", "Fan Theories", "Animation Tips", "Character Intros"]
      },
      {
        platform: "X",
        strategy: "Real-time community engagement, fan art amplification, and critic reactions.",
        contentTypes: ["Fan Art Shares", "Critic Reactions", "Hidden Details", "Community Engagement"]
      },
      {
        platform: "Meta",
        strategy: "Family-focused advertising and broader demographic reach.",
        contentTypes: ["Family Ads", "Community Content", "Event Promotions", "Targeted Campaigns"]
      }
    ],
    contentEngine: [
      { type: "TRAILER", label: "Visual Spectacle Trailers" },
      { type: "ART BREAKDOWNS", label: "Frame-by-Frame Analysis" },
      { type: "SHORT CLIPS", label: "Universe Reveals" },
      { type: "CREATOR CONTENT", label: "Artist Community" },
      { type: "FAN ART", label: "Custom Spider-People" },
      { type: "PRESS", label: "Animation Deep Dives" }
    ],
    timeline: [
      { phase: "T-6 MONTHS", title: "First Trailer", description: "Visual ambition stuns audiences — multiple animation styles revealed" },
      { phase: "T-4 MONTHS", title: "Universe Reveals", description: "New Spider-People and worlds teased through character-first content" },
      { phase: "T-2 MONTHS", title: "Art Community Activation", description: "Artist spotlights and animation breakdowns go viral" },
      { phase: "T-1 MONTH", title: "Final Trailer", description: "Cliffhanger-driven trailer creates urgency and debate" },
      { phase: "RELEASE WEEK", title: "Critical Acclaim", description: "$120M domestic opening — universal critical praise" },
      { phase: "POST RELEASE", title: "Cultural Movement", description: "$690M worldwide — cements Spider-Verse as the premium animated franchise" }
    ],
    estimatedBudget: {
      total: "$80M – $120M",
      label: "Industry Estimate",
      breakdown: [
        { category: "Media Buying", percentage: 35 },
        { category: "Digital Distribution", percentage: 30 },
        { category: "PR & Publicity", percentage: 15 },
        { category: "Creator / Influencer", percentage: 10 },
        { category: "Experiential & Events", percentage: 10 }
      ]
    },
    whyItWorked: [
      { number: "01", title: "Art Was The Marketing", description: "Every frame was so visually distinctive that sharing it was unavoidable." },
      { number: "02", title: "Community-Driven Amplification", description: "Artists and animators became the campaign's most powerful voices." },
      { number: "03", title: "Subverted The Animated Film Label", description: "Positioned as high art, not a 'kids' movie' — broadening the audience." },
      { number: "04", title: "Cliffhanger Strategy Created Urgency", description: "The 'to be continued' structure drove conversation and anticipation for Part 3." }
    ],
    highverzTakeaways: [
      { pillar: "CONTENT", insight: "When your craft is undeniable, let it lead. The animation was the marketing." },
      { pillar: "DISTRIBUTION", insight: "Activate niche communities (artists, animators) and they'll distribute your content to the mainstream." },
      { pillar: "CULTURE", insight: "Reframe your product's category. 'This isn't an animated movie — it's art' opened doors to new audiences." },
      { pillar: "GROWTH", insight: "A cliffhanger isn't just a storytelling device — it's a growth strategy. Leave them wanting more." }
    ]
  },

  // ─── TOP GUN: MAVERICK (2022) ───
  361743: {
    tmdbId: 361743,
    campaignSummary: "Paramount's campaign for Top Gun: Maverick was built on one core promise: Tom Cruise did it for real. In an era of CGI fatigue, the emphasis on practical flying, real G-forces, and Cruise's legendary commitment became the most compelling marketing message in blockbuster cinema. The campaign sold authenticity.",
    campaignGoal: "Deliver the biggest Tom Cruise opening ever and prove legacy sequels can exceed the original.",
    targetAudience: "Original Top Gun fans (Gen X), action movie audiences, aviation enthusiasts, Tom Cruise fans, 25-60 broad demographic",
    campaignDuration: "8 Months (post-COVID delay added anticipation)",
    platforms: ["YouTube", "Instagram", "X", "TikTok", "PR", "Meta"],
    promotionStrategies: [
      {
        icon: "🎬",
        title: "Trailer Strategy",
        description: "The trailer dropped at CinemaCon and instantly went viral — real jet footage, practical stunts, and nostalgia-driven emotion. The 'it's real' message was the hook that cut through CGI fatigue."
      },
      {
        icon: "📱",
        title: "Social Media Strategy",
        description: "Behind-the-scenes footage of actors in real F-18s became the most shared content. Training videos showing actors pulling 7+ Gs were irresistible. 'They actually did this' drove every share."
      },
      {
        icon: "🔥",
        title: "Cultural Marketing",
        description: "Nostalgia was weaponized brilliantly. The original Top Gun's cultural footprint — the jacket, the sunglasses, the motorcycle — was reactivated for a new generation while honoring the original audience."
      },
      {
        icon: "🤝",
        title: "Influencer Strategy",
        description: "Military aviation creators, film critics, and action movie enthusiasts received exclusive content. Real pilots reacting to the flying sequences generated enormous credibility."
      },
      {
        icon: "📰",
        title: "PR & Media",
        description: "Tom Cruise's press tour was the campaign. His personal brand — practical stunts, no green screens, pushing human limits — aligned perfectly with the film's core message."
      },
      {
        icon: "📣",
        title: "Paid Distribution",
        description: "Premium theatrical placement with emphasis on IMAX and Dolby. The COVID delay actually built anticipation — the film was positioned as 'the movie worth waiting for.'"
      }
    ],
    platformBreakdown: [
      {
        platform: "YouTube",
        strategy: "High-octane trailer content and behind-the-scenes practical stunt footage.",
        contentTypes: ["Official Trailers", "BTS Flying Footage", "Actor Training", "Real Jet Sequences"]
      },
      {
        platform: "Instagram",
        strategy: "Cinematic stills, nostalgia callbacks, and cast-driven content.",
        contentTypes: ["Production Stills", "Nostalgia Callbacks", "Cast Moments", "Premiere Coverage"]
      },
      {
        platform: "TikTok",
        strategy: "Short-form viral clips of real stunts and behind-the-scenes actor reactions.",
        contentTypes: ["Stunt Clips", "Actor G-Force Reactions", "Nostalgia Content", "Fan Reactions"]
      },
      {
        platform: "X",
        strategy: "Real-time premiere reactions and word-of-mouth amplification.",
        contentTypes: ["Premiere Reactions", "Critic Acclaim", "Audience Testimonials", "Cultural Commentary"]
      },
      {
        platform: "PR",
        strategy: "Tom Cruise's global press tour and the 'authenticity' narrative.",
        contentTypes: ["Cruise Interviews", "Cover Stories", "Festival Premieres", "Military Partnerships"]
      }
    ],
    contentEngine: [
      { type: "TRAILER", label: "Adrenaline Trailers" },
      { type: "BTS", label: "Real Flying Footage" },
      { type: "SHORT CLIPS", label: "G-Force Reactions" },
      { type: "PRESS", label: "Tom Cruise Press Tour" },
      { type: "NOSTALGIA", label: "Original Callbacks" },
      { type: "FAN CONTENT", label: "Audience Reactions" }
    ],
    timeline: [
      { phase: "T-8 MONTHS", title: "CinemaCon Trailer", description: "First trailer stuns theater owners — standing ovation" },
      { phase: "T-5 MONTHS", title: "Training Featurettes", description: "Actors in real jets — BTS content becomes the campaign" },
      { phase: "T-3 MONTHS", title: "Nostalgia Campaign", description: "Original Top Gun callbacks activate the existing fanbase" },
      { phase: "T-1 MONTH", title: "Cannes Premiere", description: "Cruise arrives by helicopter — premiere becomes global news" },
      { phase: "RELEASE WEEK", title: "Box Office Record", description: "$160M domestic opening — biggest Tom Cruise opening ever" },
      { phase: "POST RELEASE", title: "Word Of Mouth Machine", description: "$1.49B worldwide — extraordinary theatrical legs" }
    ],
    estimatedBudget: {
      total: "$120M – $150M",
      label: "Reported Estimate",
      breakdown: [
        { category: "Media Buying", percentage: 35 },
        { category: "Digital Distribution", percentage: 20 },
        { category: "PR & Publicity", percentage: 20 },
        { category: "Experiential & Events", percentage: 15 },
        { category: "Creator / Influencer", percentage: 10 }
      ]
    },
    whyItWorked: [
      { number: "01", title: "Authenticity Cut Through The Noise", description: "'They actually did this' was the most powerful message in a CGI-saturated landscape." },
      { number: "02", title: "Nostalgia Was An Emotion, Not A Gimmick", description: "Honored the original while proving the sequel could stand on its own." },
      { number: "03", title: "Tom Cruise IS The Campaign", description: "His personal brand and commitment to practical filmmaking was the ultimate marketing asset." },
      { number: "04", title: "COVID Delay Built Anticipation", description: "What could have been a setback became an advantage — audiences were desperate for this experience." },
      { number: "05", title: "Word Of Mouth Drove Historic Legs", description: "People didn't just recommend it — they demanded friends see it in theaters." }
    ],
    highverzTakeaways: [
      { pillar: "CONTENT", insight: "Authenticity is your greatest competitive advantage. In a world of shortcuts, showing the real thing is revolutionary." },
      { pillar: "DISTRIBUTION", insight: "The theatrical experience was the product. Not every content format works everywhere — know where your content has maximum impact." },
      { pillar: "CULTURE", insight: "Nostalgia is powerful but insufficient alone. Honor the past while proving you have something new to say." },
      { pillar: "GROWTH", insight: "The best growth engine is a product so good that audiences become your sales force." }
    ]
  }
};

/**
 * Get campaign analysis data for a movie by TMDB ID.
 * @param {number} tmdbId
 * @returns {object|null}
 */
export function getCampaignData(tmdbId) {
  return campaignAnalyses[tmdbId] || null;
}

/**
 * Check if campaign analysis exists for a movie.
 * @param {number} tmdbId
 * @returns {boolean}
 */
export function hasCampaignData(tmdbId) {
  return tmdbId in campaignAnalyses;
}

/**
 * Get all TMDB IDs that have campaign analysis.
 * @returns {number[]}
 */
export function getFeaturedMovieIds() {
  return Object.keys(campaignAnalyses).map(Number);
}

/**
 * Get the campaign label for a movie card.
 * @param {number} tmdbId
 * @returns {string}
 */
export function getCampaignLabel(tmdbId) {
  const labels = [
    'CAMPAIGN BREAKDOWN',
    'DISTRIBUTION ANALYSIS',
    'CULTURAL IMPACT',
    'MARKETING CASE STUDY'
  ];
  // Deterministic based on ID
  return labels[tmdbId % labels.length];
}
