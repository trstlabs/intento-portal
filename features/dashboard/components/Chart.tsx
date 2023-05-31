import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { ParamsState } from '../../../state/atoms/moduleParamsAtoms'
ChartJS.register(ArcElement, Tooltip, Legend)

type IssuanceChartProps = {
  params: ParamsState
}

const IssuanceChart = (issuanceChartProps: IssuanceChartProps) => {
  const issuance = [
    ((Number(issuanceChartProps.params.annualProvision) / 1000000000000000000000000) *
      Number(
        issuanceChartProps.params.allocModuleParams.distributionProportions
          .communityPool
      )) /
      1000000000000000000,
      ((Number(issuanceChartProps.params.annualProvision) / 1000000000000000000000000) *
      Number(
        issuanceChartProps.params.allocModuleParams.distributionProportions
          .relayerIncentives
      )) /
      1000000000000000000,
      ((Number(issuanceChartProps.params.annualProvision) / 1000000000000000000000000) *
      Number(
        issuanceChartProps.params.allocModuleParams.distributionProportions
          .staking
      )) /
      1000000000000000000,
   
  ]

  const data = {
    labels: ['Community Pool', 'Relayer Rewards', 'Staking Rewards'],
    datasets: [
      {
        label: 'Token Issuance',
        data: issuance,
        backgroundColor: ['green', 'blue', 'purple'],
        borderColor: ['green', 'blue', 'purple'],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    plugins: {
      tooltip: {
        titleFont: { size: 11, family: "Inter" },
            bodyFont: { size: 9, family: "Inter" },
        callbacks: {
          label: function (context) {
            const dataset = data.datasets[context.datasetIndex]
            const total = dataset.data.reduce(
              (accumulator, currentValue) => accumulator + currentValue
            )
            const currentValue = dataset.data[context.dataIndex]
            const percentage = ((currentValue / total) * 100).toFixed()
            return `${
              data.labels[context.dataIndex]
            }: ${currentValue} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div>
   
      <Doughnut
        style={{
          fontSize: "8px",
          maxWidth: '200px',
          minHeight: '100px',
          position: 'relative',
          // top: '50%',
          // left: '50%',
        }}
        data={data}
        options={options}
      />
    </div>
  )
}

export default IssuanceChart
