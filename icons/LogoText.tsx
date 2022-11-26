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
              fontFamily: "GothamHTF-Medium2,Gotham HTF",
              fontWeight: 500,
            }}
          >
            <tspan
              style={{
                letterSpacing: "-.02em",
              }}
            >
              {"C"}
            </tspan>
            <tspan
              x={35.9}
              y={0}
              style={{
                letterSpacing: 0,
              }}
            >
              {"O"}
            </tspan>
            <tspan
              x={78.15}
              y={0}
              style={{
                letterSpacing: 0,
              }}
            >
              {"SMOPO"}
            </tspan>
            <tspan
              x={271.95}
              y={0}
              style={{
                letterSpacing: 0,
              }}
            >
              {"R"}
            </tspan>
            <tspan
              x={307.95}
              y={0}
              style={{
                letterSpacing: "-.09em",
              }}
            >
              {"T"}
            </tspan>
            <tspan x={335.85} y={0}>
              {"AL"}
            </tspan>
          </text>
          <path
            className="cls-7"
            transform="rotate(-45 56.926 25.29)"
            d="M30.48 21.67h52.89v7.24H30.48z"
          />
          <path
            className="cls-7"
            transform="rotate(-45 249.895 25.29)"
            d="M223.45 21.67h52.89v7.24h-52.89z"
          />
        </g>
      </g>  </svg>
  )
}
