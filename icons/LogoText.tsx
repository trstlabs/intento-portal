import { SVGProps } from 'react'

export const LogoText = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg width="170" height="20" viewBox="0 0 400 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>

      <g id="Layer_2" data-name="Layer 2">
        <g id="Layer_1-2" data-name="Layer 1">
          <text
            transform="translate(0 42.5)"
            style={{
            
              fontSize: 50,
              fontFamily: "Inter",
              fontWeight: 500,
            }}
          >
            <tspan
              style={{
                letterSpacing: "-.02em",
              }}
            >
              {"TRIGGERP"}
            </tspan>
            <tspan
              x={240.9}
              y={0}
              style={{
                letterSpacing: 0,
              }}
            >
              {"O"}
            </tspan>
            <tspan
              x={280.15}
              y={0}
              style={{
                letterSpacing: 0,
              }}
            >
              {"RTAL"}
            </tspan>
          
          </text>
          <path
            className="cls-7"
            transform="rotate(-45 125 -200)"
            d="M33 50h53v7H33"
          />
        </g>
      </g>  </svg>
  )
}
