-- Event themes for public wishlists
-- Stores theme JSON so new themes can be added without code changes

create table if not exists event_themes (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_label text,
  theme jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into event_themes (event_key, event_label, theme)
values
  (
    'default',
    null,
    '{
      "key":"default",
      "palette":{
        "page_bg":"linear-gradient(135deg, #dbeafe 0%, #ede9fe 45%, #fce7f3 100%)",
        "title_gradient":"linear-gradient(90deg, #1d4ed8, #9333ea)",
        "card_bg":"#ffffff",
        "border":"#c7d2fe",
        "accent":"#9333ea"
      },
      "decorations":[
        {"kind":"blob","x":"-6%","y":"-12%","size":260,"opacity":0.2,"blur":48,"gradient":"linear-gradient(135deg, #a5b4fc, #fbcfe8)"},
        {"kind":"blob","x":"80%","y":"-8%","size":220,"opacity":0.18,"blur":42,"gradient":"linear-gradient(135deg, #bfdbfe, #f9a8d4)"},
        {"kind":"emoji","x":"9%","y":"16%","size":36,"opacity":0.2,"rotate":-8,"emoji":"✨"},
        {"kind":"emoji","x":"88%","y":"78%","size":30,"opacity":0.18,"rotate":6,"emoji":"🌟"}
      ],
      "reserved_overlay":{ "type":"sparkles", "opacity":0.22, "colors":["#ffffff", "#c7d2fe", "#fbcfe8", "#bfdbfe"], "icon":"✨" }
    }'::jsonb
  ),
  (
    'birthday',
    'День рождения',
    '{
      "key":"birthday",
      "label":"День рождения",
      "palette":{
        "page_bg":"linear-gradient(135deg, #fbcfe8 0%, #fde68a 45%, #fecdd3 100%)",
        "title_gradient":"linear-gradient(90deg, #ec4899, #f97316)",
        "card_bg":"#ffffff",
        "border":"#f9a8d4",
        "accent":"#f97316"
      },
      "decorations":[
        {"kind":"blob","x":"-8%","y":"-12%","size":260,"opacity":0.22,"blur":44,"gradient":"linear-gradient(135deg, #f9a8d4, #fde68a)"},
        {"kind":"blob","x":"78%","y":"-6%","size":240,"opacity":0.2,"blur":42,"gradient":"linear-gradient(135deg, #fecaca, #fbcfe8)"},
        {"kind":"emoji","x":"7%","y":"12%","size":44,"opacity":0.38,"rotate":-8,"emoji":"🎈"},
        {"kind":"emoji","x":"88%","y":"14%","size":40,"opacity":0.32,"rotate":10,"emoji":"🎂"},
        {"kind":"emoji","x":"16%","y":"78%","size":32,"opacity":0.22,"rotate":-6,"emoji":"🎉"},
        {"kind":"emoji","x":"92%","y":"72%","size":28,"opacity":0.18,"rotate":8,"emoji":"🧁"}
      ],
      "reserved_overlay":{ "type":"fireworks", "opacity":0.28, "colors":["#f97316", "#ec4899", "#fde68a", "#fbcfe8", "#fca5a5"], "icon":"🎉" }
    }'::jsonb
  ),
  (
    'new-year',
    'Новый год',
    '{
      "key":"new-year",
      "label":"Новый год",
      "palette":{
        "page_bg":"linear-gradient(135deg, #bfdbfe 0%, #bbf7d0 45%, #bae6fd 100%)",
        "title_gradient":"linear-gradient(90deg, #16a34a, #2563eb)",
        "card_bg":"#ffffff",
        "border":"#a5b4fc",
        "accent":"#16a34a"
      },
      "decorations":[
        {"kind":"blob","x":"78%","y":"-12%","size":260,"opacity":0.2,"blur":44,"gradient":"linear-gradient(135deg, #bbf7d0, #bae6fd)"},
        {"kind":"blob","x":"-10%","y":"-6%","size":220,"opacity":0.18,"blur":40,"gradient":"linear-gradient(135deg, #dbeafe, #bbf7d0)"},
        {"kind":"emoji","x":"10%","y":"16%","size":42,"opacity":0.32,"rotate":-6,"emoji":"❄️"},
        {"kind":"emoji","x":"86%","y":"18%","size":38,"opacity":0.28,"rotate":8,"emoji":"🎆"},
        {"kind":"emoji","x":"18%","y":"78%","size":30,"opacity":0.2,"rotate":-6,"emoji":"🎄"},
        {"kind":"emoji","x":"90%","y":"70%","size":26,"opacity":0.18,"rotate":6,"emoji":"⭐"}
      ],
      "reserved_overlay":{ "type":"fireworks", "opacity":0.26, "colors":["#16a34a", "#2563eb", "#bae6fd", "#bbf7d0", "#f8fafc"], "icon":"🎆" }
    }'::jsonb
  ),
  (
    'christmas',
    'Рождество',
    '{
      "key":"christmas",
      "label":"Рождество",
      "palette":{
        "page_bg":"linear-gradient(135deg, #fecaca 0%, #ecfccb 45%, #fed7aa 100%)",
        "title_gradient":"linear-gradient(90deg, #dc2626, #16a34a)",
        "card_bg":"#ffffff",
        "border":"#fca5a5",
        "accent":"#16a34a"
      },
      "decorations":[
        {"kind":"blob","x":"-10%","y":"-8%","size":240,"opacity":0.2,"blur":40,"gradient":"linear-gradient(135deg, #fecaca, #fef9c3)"},
        {"kind":"blob","x":"80%","y":"-10%","size":210,"opacity":0.18,"blur":38,"gradient":"linear-gradient(135deg, #bbf7d0, #fed7aa)"},
        {"kind":"emoji","x":"8%","y":"14%","size":40,"opacity":0.32,"rotate":-8,"emoji":"🎄"},
        {"kind":"emoji","x":"84%","y":"16%","size":36,"opacity":0.26,"rotate":6,"emoji":"⭐"},
        {"kind":"emoji","x":"16%","y":"78%","size":30,"opacity":0.2,"rotate":-6,"emoji":"🔔"},
        {"kind":"emoji","x":"90%","y":"72%","size":26,"opacity":0.18,"rotate":8,"emoji":"🎁"}
      ],
      "reserved_overlay":{ "type":"sparkles", "opacity":0.24, "colors":["#16a34a", "#dc2626", "#fef3c7", "#fed7aa"], "icon":"🎄" }
    }'::jsonb
  ),
  (
    'wedding',
    'Свадьба',
    '{
      "key":"wedding",
      "label":"Свадьба",
      "palette":{
        "page_bg":"linear-gradient(135deg, #fdf2f8 0%, #f5d0fe 40%, #e9d5ff 100%)",
        "title_gradient":"linear-gradient(90deg, #db2777, #7c3aed)",
        "card_bg":"#ffffff",
        "border":"#e9d5ff",
        "accent":"#db2777"
      },
      "decorations":[
        {"kind":"blob","x":"82%","y":"-10%","size":240,"opacity":0.18,"blur":42,"gradient":"linear-gradient(135deg, #fbcfe8, #ddd6fe)"},
        {"kind":"blob","x":"-8%","y":"-6%","size":210,"opacity":0.16,"blur":38,"gradient":"linear-gradient(135deg, #fed7aa, #fbcfe8)"},
        {"kind":"emoji","x":"10%","y":"14%","size":36,"opacity":0.3,"rotate":-6,"emoji":"💍"},
        {"kind":"emoji","x":"86%","y":"20%","size":32,"opacity":0.24,"rotate":8,"emoji":"✨"},
        {"kind":"emoji","x":"16%","y":"78%","size":30,"opacity":0.2,"rotate":-6,"emoji":"🥂"},
        {"kind":"emoji","x":"90%","y":"72%","size":26,"opacity":0.18,"rotate":6,"emoji":"💐"}
      ],
      "reserved_overlay":{ "type":"sparkles", "opacity":0.22, "colors":["#db2777", "#7c3aed", "#fbcfe8", "#e9d5ff"], "icon":"💍" }
    }'::jsonb
  ),
  (
    'anniversary',
    'Годовщина',
    '{
      "key":"anniversary",
      "label":"Годовщина",
      "palette":{
        "page_bg":"linear-gradient(135deg, #fecdd3 0%, #fde7f3 45%, #fef3c7 100%)",
        "title_gradient":"linear-gradient(90deg, #e11d48, #f59e0b)",
        "card_bg":"#ffffff",
        "border":"#fda4af",
        "accent":"#e11d48"
      },
      "decorations":[
        {"kind":"blob","x":"-6%","y":"-10%","size":240,"opacity":0.2,"blur":42,"gradient":"linear-gradient(135deg, #fecdd3, #fef3c7)"},
        {"kind":"blob","x":"80%","y":"-8%","size":210,"opacity":0.18,"blur":38,"gradient":"linear-gradient(135deg, #fbcfe8, #fed7aa)"},
        {"kind":"emoji","x":"8%","y":"14%","size":36,"opacity":0.3,"rotate":-6,"emoji":"💑"},
        {"kind":"emoji","x":"86%","y":"18%","size":30,"opacity":0.2,"rotate":8,"emoji":"✨"},
        {"kind":"emoji","x":"90%","y":"72%","size":26,"opacity":0.18,"rotate":6,"emoji":"💞"}
      ],
      "reserved_overlay":{ "type":"sparkles", "opacity":0.22, "colors":["#e11d48", "#f59e0b", "#fecdd3", "#fef3c7"], "icon":"💞" }
    }'::jsonb
  ),
  (
    'valentines',
    'День Святого Валентина',
    '{
      "key":"valentines",
      "label":"День Святого Валентина",
      "palette":{
        "page_bg":"linear-gradient(135deg, #fecdd3 0%, #fbcfe8 45%, #ffe4e6 100%)",
        "title_gradient":"linear-gradient(90deg, #db2777, #f43f5e)",
        "card_bg":"#ffffff",
        "border":"#fda4af",
        "accent":"#f43f5e"
      },
      "decorations":[
        {"kind":"blob","x":"78%","y":"-10%","size":240,"opacity":0.18,"blur":42,"gradient":"linear-gradient(135deg, #fda4af, #fbcfe8)"},
        {"kind":"blob","x":"-10%","y":"-8%","size":210,"opacity":0.18,"blur":40,"gradient":"linear-gradient(135deg, #fecdd3, #fbcfe8)"},
        {"kind":"emoji","x":"10%","y":"14%","size":38,"opacity":0.3,"rotate":-6,"emoji":"💝"},
        {"kind":"emoji","x":"86%","y":"18%","size":34,"opacity":0.22,"rotate":8,"emoji":"💗"},
        {"kind":"emoji","x":"16%","y":"78%","size":30,"opacity":0.2,"rotate":-6,"emoji":"🌹"},
        {"kind":"emoji","x":"90%","y":"72%","size":26,"opacity":0.18,"rotate":6,"emoji":"💘"}
      ],
      "reserved_overlay":{ "type":"confetti", "opacity":0.25, "colors":["#db2777", "#f43f5e", "#fda4af"], "icon":"💘" }
    }'::jsonb
  ),
  (
    'womens-day',
    '8 Марта',
    '{
      "key":"womens-day",
      "label":"8 Марта",
      "palette":{
        "page_bg":"linear-gradient(135deg, #fbcfe8 0%, #fce7f3 45%, #bbf7d0 100%)",
        "title_gradient":"linear-gradient(90deg, #ec4899, #16a34a)",
        "card_bg":"#ffffff",
        "border":"#f9a8d4",
        "accent":"#ec4899"
      },
      "decorations":[
        {"kind":"blob","x":"-8%","y":"-12%","size":240,"opacity":0.2,"blur":40,"gradient":"linear-gradient(135deg, #fbcfe8, #bbf7d0)"},
        {"kind":"blob","x":"80%","y":"-8%","size":210,"opacity":0.18,"blur":38,"gradient":"linear-gradient(135deg, #fce7f3, #bbf7d0)"},
        {"kind":"emoji","x":"8%","y":"14%","size":38,"opacity":0.32,"rotate":-6,"emoji":"🌸"},
        {"kind":"emoji","x":"86%","y":"18%","size":34,"opacity":0.24,"rotate":8,"emoji":"🌷"},
        {"kind":"emoji","x":"16%","y":"78%","size":30,"opacity":0.2,"rotate":-6,"emoji":"🌼"},
        {"kind":"emoji","x":"90%","y":"72%","size":26,"opacity":0.18,"rotate":6,"emoji":"💐"}
      ],
      "reserved_overlay":{ "type":"sparkles", "opacity":0.22, "colors":["#ec4899", "#16a34a", "#fbcfe8", "#bbf7d0"], "icon":"🌸" }
    }'::jsonb
  ),
  (
    'mens-day',
    '23 Февраля',
    '{
      "key":"mens-day",
      "label":"23 Февраля",
      "palette":{
        "page_bg":"linear-gradient(135deg, #c7d2fe 0%, #e2e8f0 45%, #bae6fd 100%)",
        "title_gradient":"linear-gradient(90deg, #0f172a, #1d4ed8)",
        "card_bg":"#ffffff",
        "border":"#a5b4fc",
        "accent":"#1d4ed8"
      },
      "decorations":[
        {"kind":"blob","x":"80%","y":"-12%","size":260,"opacity":0.18,"blur":44,"gradient":"linear-gradient(135deg, #c7d2fe, #bae6fd)"},
        {"kind":"blob","x":"-10%","y":"-8%","size":210,"opacity":0.16,"blur":40,"gradient":"linear-gradient(135deg, #a5b4fc, #e2e8f0)"},
        {"kind":"emoji","x":"10%","y":"14%","size":36,"opacity":0.28,"rotate":-6,"emoji":"🎖️"},
        {"kind":"emoji","x":"16%","y":"78%","size":28,"opacity":0.18,"rotate":-6,"emoji":"🛡️"},
        {"kind":"emoji","x":"90%","y":"72%","size":24,"opacity":0.16,"rotate":6,"emoji":"🏅"}
      ],
      "reserved_overlay":{ "type":"fireworks", "opacity":0.24, "colors":["#1d4ed8", "#0f172a", "#a5b4fc", "#bae6fd"], "icon":"🛡️" }
    }'::jsonb
  ),
  (
    'graduation',
    'Выпускной',
    '{
      "key":"graduation",
      "label":"Выпускной",
      "palette":{
        "page_bg":"linear-gradient(135deg, #c7d2fe 0%, #bae6fd 45%, #fbcfe8 100%)",
        "title_gradient":"linear-gradient(90deg, #6366f1, #0ea5e9)",
        "card_bg":"#ffffff",
        "border":"#a5b4fc",
        "accent":"#6366f1"
      },
      "decorations":[
        {"kind":"blob","x":"-6%","y":"-12%","size":240,"opacity":0.2,"blur":42,"gradient":"linear-gradient(135deg, #c7d2fe, #bae6fd)"},
        {"kind":"blob","x":"80%","y":"-8%","size":210,"opacity":0.18,"blur":38,"gradient":"linear-gradient(135deg, #fbcfe8, #bae6fd)"},
        {"kind":"emoji","x":"8%","y":"14%","size":38,"opacity":0.28,"rotate":-6,"emoji":"🎓"},
        {"kind":"emoji","x":"86%","y":"18%","size":32,"opacity":0.22,"rotate":8,"emoji":"✨"},
        {"kind":"emoji","x":"16%","y":"78%","size":30,"opacity":0.2,"rotate":-6,"emoji":"🏆"},
        {"kind":"emoji","x":"90%","y":"72%","size":24,"opacity":0.16,"rotate":6,"emoji":"📜"}
      ],
      "reserved_overlay":{ "type":"confetti", "opacity":0.24, "colors":["#6366f1", "#0ea5e9", "#fbcfe8"], "icon":"🎓" }
    }'::jsonb
  ),
  (
    'baby-shower',
    'Рождение ребенка',
    '{
      "key":"baby-shower",
      "label":"Рождение ребенка",
      "palette":{
        "page_bg":"linear-gradient(135deg, #bae6fd 0%, #fbcfe8 45%, #bbf7d0 100%)",
        "title_gradient":"linear-gradient(90deg, #0ea5e9, #ec4899)",
        "card_bg":"#ffffff",
        "border":"#7dd3fc",
        "accent":"#0ea5e9"
      },
      "decorations":[
        {"kind":"blob","x":"82%","y":"-12%","size":240,"opacity":0.2,"blur":42,"gradient":"linear-gradient(135deg, #bae6fd, #fbcfe8)"},
        {"kind":"blob","x":"-10%","y":"-8%","size":210,"opacity":0.18,"blur":38,"gradient":"linear-gradient(135deg, #bbf7d0, #bae6fd)"},
        {"kind":"emoji","x":"10%","y":"14%","size":36,"opacity":0.28,"rotate":-6,"emoji":"🍼"},
        {"kind":"emoji","x":"86%","y":"18%","size":32,"opacity":0.22,"rotate":8,"emoji":"👶"},
        {"kind":"emoji","x":"16%","y":"78%","size":30,"opacity":0.2,"rotate":-6,"emoji":"⭐"},
        {"kind":"emoji","x":"90%","y":"72%","size":24,"opacity":0.16,"rotate":6,"emoji":"🧸"}
      ],
      "reserved_overlay":{ "type":"sparkles", "opacity":0.22, "colors":["#0ea5e9", "#ec4899", "#bae6fd", "#fbcfe8"], "icon":"🍼" }
    }'::jsonb
  )
on conflict (event_key) do update
  set event_label = excluded.event_label,
      theme = excluded.theme,
      is_active = true;
