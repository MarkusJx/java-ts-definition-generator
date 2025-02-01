import path from 'path';
import { findAllClassesMatching } from '../.';
import { expect } from 'chai';

describe('Find all classes matching test', () => {
    it('Find all classes from basic jar', async () => {
        const classes = await findAllClassesMatching(
            [path.join(__dirname, '..', 'dist', 'ASTGenerator.jar')],
            ['com.github.markusjx.*', 'com.google.*']
        );

        expect(classes).to.have.length.greaterThan(1);
    });
});
