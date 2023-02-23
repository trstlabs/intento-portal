import {
    Button,
    ButtonWithDropdown,
    ChevronIcon,
    Column,
    Divider,
    Text,
    ValidIcon,
  } from 'junoblocks'
  
  import { SortDirections, SortParameters } from '../hooks/useSortAutoTxs'
  type Props = {
    sortParameter: SortParameters
    sortDirection: SortDirections
    onSortParameterChange: (parameter: SortParameters) => void
    onSortDirectionChange: (direction: SortDirections) => void
  }
  
  export const ButtonWithDropdownForSorting = ({
    sortParameter,
    sortDirection,
    onSortParameterChange,
    onSortDirectionChange,
  }: Props) => {
    function getSortByLabel() {
      if (sortParameter === 'alphabetical') {
        return 'Sort alphabetically'
      }
      if (sortParameter === 'exec_time') {
        return 'Sort by execute time'
      }
      return `Sort by ${sortParameter}`
    }
  
    return (
      <ButtonWithDropdown
        dropdown={
          <>
            <Column css={{ padding: '$6 $6 $4' }}>
              <Button
                variant="ghost"
                onClick={() => onSortParameterChange('alphabetical')}
                selected={sortParameter === 'alphabetical'}
                iconLeft={
                  <ValidIcon visible={sortParameter === 'alphabetical'} />
                }
              >
                Alphabetical order
              </Button>
              <Button
                variant="ghost"
                onClick={() => onSortParameterChange('exec_time')}
                selected={sortParameter === 'exec_time'}
                iconLeft={<ValidIcon visible={sortParameter === 'exec_time'} />}
              >
                AutoExec Time
              </Button>
            </Column>
            <Divider />
            <Text variant="legend" css={{ padding: '$8 $6 $4' }}>
              Sorting order
            </Text>
            <Column css={{ padding: '0 $6 $6' }}>
              <Button
                variant="ghost"
                onClick={() => onSortDirectionChange('desc')}
                selected={sortDirection === 'desc'}
                iconLeft={<ValidIcon visible={sortDirection === 'desc'} />}
              >
                Descending
              </Button>
              <Button
                variant="ghost"
                onClick={() => onSortDirectionChange('asc')}
                selected={sortDirection === 'asc'}
                iconLeft={<ValidIcon visible={sortDirection === 'asc'} />}
              >
                Ascending
              </Button>
            </Column>
          </>
        }
        iconRight={<ChevronIcon rotation="-90deg" />}
      >
        {getSortByLabel()}
      </ButtonWithDropdown>
    )
  }
  