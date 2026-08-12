"use client";

import { useRef } from "react";
import { IconBraces } from "@tabler/icons-react";

import { socialCaptionPlaceholders } from "@/domain/social-caption";

const exampleCaption = `🏍 {name} · {year}
💰 {price}
🎨 {color}
📝 {description}

📍 {shopName}
📞 {phone}
🔗 {listingUrl}`;

export function CaptionTemplateField({ defaultValue }: { defaultValue?: string | null }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertPlaceholder(placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    textarea.setRangeText(placeholder, start, textarea.selectionEnd, "end");
    textarea.focus();
  }

  return (
    <div className="caption-template-field">
      <div className="caption-template-heading">
        <span><IconBraces size={18} /></span>
        <div><strong>Post caption <small>(optional)</small></strong><p>Customize this channel only. Leave blank to use TexMoto’s bilingual caption.</p></div>
      </div>
      <textarea ref={textareaRef} className="field caption-template-input" name="captionTemplate" defaultValue={defaultValue ?? ""} placeholder={exampleCaption} maxLength={4_000} rows={9} />
      <details className="caption-placeholder-help">
        <summary>Insert motorcycle or shop details</summary>
        <div className="caption-placeholder-list">
          {socialCaptionPlaceholders.map((placeholder) => <button key={placeholder} type="button" onClick={() => insertPlaceholder(placeholder)}>{placeholder}</button>)}
        </div>
        <p>If an optional value is missing, TexMoto removes that line from the published caption.</p>
      </details>
    </div>
  );
}
