import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FormulaInput from './components/FormulaInput';
import {Card, Flex, List, MantineProvider, Title} from "@mantine/core";
import './App.css'

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <div className="App">
          <Flex direction="column" gap='xl'>
            <Card withBorder shadow="md">
              <Title>Tip</Title>
              <List center={false} style={{
                textAlign: 'left',
              }}>
                <List.Item>Type tag name or category</List.Item>
                <List.Item>Type operand for calculation and press space button</List.Item>
                <List.Item>Type another one tag or number</List.Item>
              </List>
            </Card>
            <FormulaInput/>
          </Flex>
        </div>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;