import { render, screen } from '@testing-library/react';
import MetricCard from '@/components/MetricCard';
import { faDroplet } from '@fortawesome/free-solid-svg-icons';

describe('MetricCard', () => {
  it('renders label, value and unit', () => {
    render(
      <MetricCard
        label="Current Flow Rate"
        value="1.23"
        unit="L/min"
        icon={faDroplet}
        accent={true}
      />
    );

    expect(screen.getByText('Current Flow Rate')).toBeInTheDocument();
    expect(screen.getByText('1.23')).toBeInTheDocument();
    expect(screen.getByText('L/min')).toBeInTheDocument();
  });
});
