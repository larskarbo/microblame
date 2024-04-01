import { Grammar, highlight, languages } from "prismjs"
import React, { CSSProperties } from "react"

export const Code: React.FC<{
  code: string
  language: string
  className?: string
  style?: CSSProperties // Add style prop here of type CSSProperties.
}> = ({ code, language = "javascript", className, style }) => {
  const languageL = language.toLowerCase()
  const prismLanguage =
    languages[languageL] || (languages.javascript as Grammar)

  return (
    <pre
      style={style} // Assign the style prop to the style property of the pre element.
      className={`bg-gray-800 rounded-sm p-4 text-white ${className}`}
    >
      <code
        className={``}
        dangerouslySetInnerHTML={{
          __html: highlight(code, prismLanguage, language),
        }}
      />
    </pre>
  )
}
