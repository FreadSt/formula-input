import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FormulaInput from './components/FormulaInput';
import {Card, Flex, List, MantineProvider} from "@mantine/core";
import './App.css'

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <div className="App">
          <Flex direction="column" gap='xl'>
            <Card withBorder shadow="md">
              <h1>Tip</h1>
              <List center={false}>
                <List.Item>Type tag name or category</List.Item>
                <List.Item>Type operand for calculation and press space button</List.Item>
                <List.Item>Type another one tag</List.Item>
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